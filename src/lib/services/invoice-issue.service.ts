import "server-only";
import type { BusinessProfile, CheckoutDocument, InvoiceCarrierType, RegionalReceiptSettings } from "@/lib/schema";
import type { Sale } from "@/lib/types/sale";
import { appendInvoiceLog } from "@/lib/services/invoice-log.service";
import { createInvoicePlatformAdapter } from "@/lib/services/invoice-platform.service";
import { getInvoiceSettings } from "@/lib/services/invoice-settings.service";
import { allocateInvoiceTrackNumber } from "@/lib/services/invoice-track.service";
import { createInvoiceDraft, getInvoiceDraftById, updateInvoiceDraft } from "@/lib/services/invoice-draft.service";
import { saveReceiptDocument, getReceiptDocumentById } from "@/lib/services/receipt-document.service";
import { normalizeInvoiceItem } from "@/lib/schema/invoice-item.schema";
import { normalizeReceiptDocumentRecord, type ReceiptDocumentRecord } from "@/lib/schema/receipt-document.schema";
import { upsertInvoiceCarrier } from "@/lib/services/invoice-carrier.service";
import { createInvoiceEntityId } from "@/lib/services/invoice-service.shared";

function roundMoney(value: number): number {
    if (!Number.isFinite(value)) return 0;
    return Math.round(Math.max(0, value) * 100) / 100;
}

function resolveReceiptDocumentType(document: CheckoutDocument, region: RegionalReceiptSettings["businessRegion"]): ReceiptDocumentRecord["documentType"] {
    if (region === "TW") {
        return document.documentMode === "electronic-invoice" ? "electronic-invoice" : "receipt";
    }
    if (document.documentMode === "tax-invoice") return "tax-invoice";
    if (document.documentMode === "invoice") return "invoice";
    return "receipt";
}

function deriveTaxes(params: {
    settings: RegionalReceiptSettings;
    documentType: ReceiptDocumentRecord["documentType"];
    sale: Sale;
}) {
    const total = roundMoney(params.sale.amount);
    if (params.settings.businessRegion === "AU" && params.settings.au.gstRegistered && params.documentType === "tax-invoice") {
        const amount = roundMoney(total / 1.1);
        const taxAmount = roundMoney(total - amount);
        return { amount, taxAmount, totalAmount: total };
    }
    return { amount: total, taxAmount: 0, totalAmount: total };
}

function buildDraftItems(params: {
    sale: Sale;
    settings: RegionalReceiptSettings;
    documentType: ReceiptDocumentRecord["documentType"];
}) {
    return (params.sale.lineItems ?? []).map((line, index) => {
        const gross = roundMoney(line.subtotal);
        if (params.settings.businessRegion === "AU" && params.settings.au.gstRegistered && params.documentType === "tax-invoice") {
            const amount = roundMoney(gross / 1.1);
            const taxAmount = roundMoney(gross - amount);
            return normalizeInvoiceItem({
                id: `line_${index + 1}`,
                productId: line.productId,
                name: line.productName,
                description: line.isUsedProduct ? [line.usedBrand, line.usedModel, line.usedSerialOrImei].filter(Boolean).join(" / ") : "",
                qty: line.qty,
                unitPrice: line.unitPrice,
                amount,
                taxAmount,
                totalAmount: gross,
                currency: params.settings.currency,
            });
        }

        return normalizeInvoiceItem({
            id: `line_${index + 1}`,
            productId: line.productId,
            name: line.productName,
            description: line.isUsedProduct ? [line.usedBrand, line.usedModel, line.usedSerialOrImei].filter(Boolean).join(" / ") : "",
            qty: line.qty,
            unitPrice: line.unitPrice,
            amount: gross,
            taxAmount: 0,
            totalAmount: gross,
            currency: params.settings.currency,
        });
    });
}

export async function createCheckoutInvoiceDraft(input: {
    companyId: string;
    operatorUid: string;
    sale: Sale;
    checkoutDocument: CheckoutDocument;
    businessProfile: BusinessProfile | null;
    regionalReceiptSettings: RegionalReceiptSettings;
}): Promise<Awaited<ReturnType<typeof createInvoiceDraft>>> {
    const invoiceSettings = await getInvoiceSettings(input.companyId);
    if (!invoiceSettings) return null;

    const documentType = resolveReceiptDocumentType(input.checkoutDocument, input.regionalReceiptSettings.businessRegion);
    const totals = deriveTaxes({
        settings: input.regionalReceiptSettings,
        documentType,
        sale: input.sale,
    });

    const draft = await createInvoiceDraft({
        companyId: input.companyId,
        updatedBy: input.operatorUid,
        branchId: invoiceSettings.defaultBranchId || "main",
        checkoutId: input.sale.id,
        orderId: input.sale.id,
        region: input.regionalReceiptSettings.businessRegion,
        integrationMode: invoiceSettings.integrationMode,
        documentType,
        buyerType: input.checkoutDocument.buyerType,
        buyerName:
            input.regionalReceiptSettings.businessRegion === "AU"
                ? input.checkoutDocument.au.buyerName || input.sale.customerName || ""
                : input.sale.customerName || "",
        buyerTaxId: input.checkoutDocument.tw.taxId || "",
        buyerAbn: input.checkoutDocument.au.buyerAbn || "",
        carrierType: input.checkoutDocument.tw.carrierType as InvoiceCarrierType,
        carrierCode: input.checkoutDocument.tw.carrierCode || "",
        donationCode: input.checkoutDocument.tw.donationCode || "",
        currency: input.regionalReceiptSettings.currency,
        items: buildDraftItems({
            sale: input.sale,
            settings: input.regionalReceiptSettings,
            documentType,
        }),
        amount: totals.amount,
        taxAmount: totals.taxAmount,
        totalAmount: totals.totalAmount,
        status: "draft",
    });

    if (draft) {
        await appendInvoiceLog({
            companyId: input.companyId,
            actorUid: input.operatorUid,
            draftId: draft.id,
            action: "draft_created",
            message: `Draft created from checkout ${input.sale.id}`,
            payload: { checkoutId: input.sale.id, saleId: input.sale.id, documentType },
        });
    }
    return draft;
}

export async function issueInvoiceDraft(params: {
    companyId: string;
    operatorUid: string;
    draftId: string;
    reissueFromDocumentId?: string;
}): Promise<ReceiptDocumentRecord | null> {
    const draft = await getInvoiceDraftById(params.draftId, params.companyId);
    const invoiceSettings = await getInvoiceSettings(params.companyId);
    if (!draft || !invoiceSettings) return null;

    const allocated = await allocateInvoiceTrackNumber({
        companyId: params.companyId,
        region: draft.region,
        documentType: draft.documentType,
        integrationMode: draft.integrationMode,
    });

    await appendInvoiceLog({
        companyId: params.companyId,
        actorUid: params.operatorUid,
        draftId: draft.id,
        action: "track_allocated",
        message: `Allocated document number ${allocated.documentNo}`,
        payload: allocated,
    });

    const adapter = createInvoicePlatformAdapter(draft.integrationMode);
    await updateInvoiceDraft(draft.id, { status: "issue_requested" }, params.companyId);
    await appendInvoiceLog({
        companyId: params.companyId,
        actorUid: params.operatorUid,
        draftId: draft.id,
        action: "issue_requested",
        message: "Issue request started",
        payload: { mode: draft.integrationMode, documentType: draft.documentType },
    });

    const issueResult = await adapter.issueInvoice({
        draft,
        settings: invoiceSettings,
        documentNo: allocated.documentNo,
        trackPrefix: allocated.trackPrefix,
    });

    const record = normalizeReceiptDocumentRecord({
        id: createInvoiceEntityId("idoc"),
        companyId: params.companyId,
        branchId: draft.branchId,
        region: draft.region,
        integrationMode: draft.integrationMode,
        documentType: draft.documentType,
        orderId: draft.orderId,
        checkoutId: draft.checkoutId,
        draftId: draft.id,
        documentNo: allocated.documentNo,
        trackPrefix: allocated.trackPrefix,
        issuedAt: new Date().toISOString(),
        buyerType: draft.buyerType,
        buyerName: draft.buyerName,
        buyerTaxId: draft.buyerTaxId,
        buyerAbn: draft.buyerAbn,
        carrierType: draft.carrierType,
        carrierCode: draft.carrierCode,
        donationCode: draft.donationCode,
        currency: draft.currency,
        items: draft.items,
        amount: draft.amount,
        taxAmount: draft.taxAmount,
        totalAmount: draft.totalAmount,
        status: params.reissueFromDocumentId && issueResult.documentStatus === "issued" ? "reissued" : issueResult.documentStatus,
        voidedAt: "",
        voidReason: "",
        voidRequestId: "",
        reissueFromDocumentId: params.reissueFromDocumentId ?? "",
        reissueToDocumentId: "",
        platformRequestPayload: issueResult.requestPayload,
        platformResponsePayload: issueResult.responsePayload,
        platformStatus: issueResult.platformStatus,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    });

    await saveReceiptDocument(record);
    await updateInvoiceDraft(
        draft.id,
        {
            status: issueResult.success ? "issued" : "issue_failed",
            sourceDocumentId: record.id,
        },
        params.companyId,
    );
    await appendInvoiceLog({
        companyId: params.companyId,
        actorUid: params.operatorUid,
        documentId: record.id,
        draftId: draft.id,
        action: issueResult.success ? "issued" : "issue_failed",
        level: issueResult.success ? "info" : "error",
        message: issueResult.message,
        payload: {
            requestId: issueResult.requestId,
            platformStatus: issueResult.platformStatus,
            documentStatus: record.status,
        },
    });

    return record;
}

export async function createAndIssueCheckoutReceiptDocument(input: {
    companyId: string;
    operatorUid: string;
    sale: Sale;
    businessProfile: BusinessProfile | null;
    regionalReceiptSettings: RegionalReceiptSettings;
}): Promise<{ draftId: string; document: ReceiptDocumentRecord | null } | null> {
    const checkoutDocument = input.sale.checkoutDocument;
    if (!checkoutDocument) return null;

    const invoiceSettings = await getInvoiceSettings(input.companyId);
    if (!invoiceSettings || !invoiceSettings.enabled) return null;

    const draft = await createCheckoutInvoiceDraft({
        companyId: input.companyId,
        operatorUid: input.operatorUid,
        sale: input.sale,
        checkoutDocument,
        businessProfile: input.businessProfile,
        regionalReceiptSettings: input.regionalReceiptSettings,
    });
    if (!draft) return null;

    if (!invoiceSettings.autoIssueOnCheckout) {
        return { draftId: draft.id, document: null };
    }

    const document = await issueInvoiceDraft({
        companyId: input.companyId,
        operatorUid: input.operatorUid,
        draftId: draft.id,
    });
    if (
        document &&
        input.sale.customerId &&
        input.sale.checkoutDocument?.businessRegion === "TW" &&
        input.sale.checkoutDocument.tw.carrierType !== "none" &&
        input.sale.checkoutDocument.tw.carrierCode
    ) {
        await upsertInvoiceCarrier({
            companyId: input.companyId,
            customerId: input.sale.customerId,
            type: input.sale.checkoutDocument.tw.carrierType,
            code: input.sale.checkoutDocument.tw.carrierCode,
            isDefault: true,
            updatedBy: input.operatorUid,
        });
    }
    return {
        draftId: draft.id,
        document,
    };
}

export async function reissueVoidedReceiptDocument(input: {
    companyId: string;
    operatorUid: string;
    documentId: string;
}): Promise<ReceiptDocumentRecord | null> {
    const current = await getReceiptDocumentById(input.documentId, input.companyId);
    const invoiceSettings = await getInvoiceSettings(input.companyId);
    if (!current || !invoiceSettings || !invoiceSettings.allowReissueAfterVoid || current.status !== "voided") return null;

    const draft = await createInvoiceDraft({
        companyId: input.companyId,
        updatedBy: input.operatorUid,
        branchId: current.branchId,
        checkoutId: current.checkoutId,
        orderId: current.orderId,
        region: current.region,
        integrationMode: current.integrationMode,
        documentType: current.documentType,
        buyerType: current.buyerType,
        buyerName: current.buyerName,
        buyerTaxId: current.buyerTaxId,
        buyerAbn: current.buyerAbn,
        carrierType: current.carrierType,
        carrierCode: current.carrierCode,
        donationCode: current.donationCode,
        currency: current.currency,
        items: current.items,
        amount: current.amount,
        taxAmount: current.taxAmount,
        totalAmount: current.totalAmount,
        sourceDocumentId: current.id,
    });
    if (!draft) return null;

    await appendInvoiceLog({
        companyId: input.companyId,
        actorUid: input.operatorUid,
        documentId: current.id,
        draftId: draft.id,
        action: "reissue_requested",
        message: `Reissue requested from voided document ${current.documentNo || current.id}`,
    });

    const reissued = await issueInvoiceDraft({
        companyId: input.companyId,
        operatorUid: input.operatorUid,
        draftId: draft.id,
        reissueFromDocumentId: current.id,
    });
    if (!reissued) return null;

    await saveReceiptDocument(
        normalizeReceiptDocumentRecord({
            ...current,
            id: current.id,
            companyId: current.companyId,
            reissueToDocumentId: reissued.id,
            updatedAt: new Date().toISOString(),
        }),
    );
    return reissued;
}
