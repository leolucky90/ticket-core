import type { MouseEvent } from "react";

export function submitBrandRename(event: MouseEvent<HTMLButtonElement>, currentName: string) {
    event.preventDefault();
    event.stopPropagation();
    const form = event.currentTarget.form;
    if (!form) return;
    const nextName = window.prompt("請輸入品牌新名稱：", currentName)?.trim() ?? "";
    if (!nextName || nextName === currentName) return;
    const brandNameInput = form.querySelector('input[name="brandName"]') as HTMLInputElement | null;
    if (!brandNameInput) return;
    brandNameInput.value = nextName;
    form.requestSubmit();
}

function setFormHiddenValue(form: HTMLFormElement, name: string, value: string) {
    let input = form.querySelector(`input[name="${name}"]`) as HTMLInputElement | null;
    if (!input) {
        input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        form.appendChild(input);
    }
    input.value = value;
}

export function prepareBrandTypeRename(event: MouseEvent<HTMLButtonElement>, currentName: string) {
    event.stopPropagation();
    const form = event.currentTarget.form;
    if (!form) {
        event.preventDefault();
        return;
    }
    const nextName = window.prompt("請輸入新的品牌類型名稱：", currentName)?.trim() ?? "";
    if (!nextName || nextName.toLowerCase() === currentName.toLowerCase()) {
        event.preventDefault();
        return;
    }
    setFormHiddenValue(form, "oldTypeName", currentName);
    setFormHiddenValue(form, "nextTypeName", nextName);
}

export function prepareBrandTypeDelete(event: MouseEvent<HTMLButtonElement>, currentName: string) {
    event.stopPropagation();
    const form = event.currentTarget.form;
    if (!form) {
        event.preventDefault();
        return;
    }
    const confirmed = window.confirm(`確定要移除品牌類型「${currentName}」嗎？該類型底下的型號也會一起停用。`);
    if (!confirmed) {
        event.preventDefault();
        return;
    }
    setFormHiddenValue(form, "oldTypeName", currentName);
    setFormHiddenValue(form, "nextTypeName", "");
}
