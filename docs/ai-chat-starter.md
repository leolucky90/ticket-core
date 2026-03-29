# AI 新對話起手式（一鍵複製）

> **Docs 版本／更正：** 見 [`DOCUMENTATION-VERSION.md`](./DOCUMENTATION-VERSION.md)

將下方 **「複製區塊」** 整段貼到新對話開頭即可。  
若專案不在預設路徑，請把 `/home/leo/dev/ticket-core` 改成你的本機路徑。

**文件集版本對齊：** 見 [`DOCUMENTATION-VERSION.md`](./DOCUMENTATION-VERSION.md)；首頁顯示與 `src/lib/documentation-version.ts` 須與該檔一致。

---

## 複製區塊（建議全文貼上）

```text
請先讀以下 ticket-core 檔案再繼續工作，並延續其中的 canonical naming、architecture、shell 與 service boundary 規則：

必讀：
- /home/leo/dev/ticket-core/docs/project-rules.md
- /home/leo/dev/ticket-core/docs/project-summary.md
- /home/leo/dev/ticket-core/docs/DOCUMENTATION-VERSION.md

建議一併掃過（導航與資料流）：
- /home/leo/dev/ticket-core/docs/codebase-map.md
- /home/leo/dev/ticket-core/docs/multi-tenant-data-flow.md

約束：新 work 不要新增對 src/lib/services/commerce.ts 或 src/lib/types/commerce.ts 的直接依賴，除非是在做 compatibility 收斂。

收尾請跑：pnpm -s lint && pnpm -s exec tsc --noEmit（完整驗證用 pnpm run verify）。
```

---

## 簡短版（僅規格）

若 token 要省，可只用：

```text
讀 /home/leo/dev/ticket-core/docs/project-rules.md 與 project-summary.md，遵守 DOCUMENTATION-VERSION.md；新依賴勿擴散 commerce.ts / types/commerce.ts。工作路徑：/home/leo/dev/ticket-core。
```
