// Canonical customer profile types shared across merchant/customer relationship flows.
export type CustomerProfile = {
    id: string;
    companyId?: string;
    userUid?: string;
    emailLower?: string;
    name: string;
    phone: string;
    email: string;
    address: string;
    createdAt: number;
    updatedAt: number;
    lastCaseAt?: number;
};

export type CustomerCaseState = "active_case" | "closed_case" | "no_case";

export type CustomerProfileListRow = {
    customer: CustomerProfile;
    openCaseCount: number;
    closedCaseCount: number;
    caseState: CustomerCaseState;
    activitySpend: number;
};

// Compatibility aliases for existing merchant dashboard naming.
export type CompanyCustomer = CustomerProfile;
export type CompanyCustomerListRow = CustomerProfileListRow;
