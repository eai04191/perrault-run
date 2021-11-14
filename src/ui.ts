export const filechooser = document.querySelector("#filechooser")!;
export const loading = document.querySelector("#loading")!;

export const canvas0 = document.querySelector<HTMLCanvasElement>("#canvas0")!;
export const ctx0 = canvas0.getContext("2d")!;
export const canvas1 = document.querySelector<HTMLCanvasElement>("#canvas1")!;
export const ctx1 = canvas1.getContext("2d")!;
export const canvas2 = document.querySelector<HTMLCanvasElement>("#canvas2")!;
export const ctx2 = canvas2.getContext("2d")!;
export const canvas3 = document.querySelector<HTMLCanvasElement>("#canvas3")!;
export const ctx3 = canvas3.getContext("2d")!;

if (
    !canvas0 ||
    !ctx0 ||
    !canvas1 ||
    !ctx1 ||
    !canvas2 ||
    !ctx2 ||
    !canvas3 ||
    !ctx3
) {
    throw new Error("canvas not found");
}

const result = document.querySelector("#result")!;

if (!result) {
    throw new Error("");
}

export function resetResult() {
    result.innerHTML = "";
}

export function appendResult(text: string) {
    result.insertAdjacentHTML("beforeend", `<li>${text}</li>`);
}

document.querySelectorAll(".card").forEach((card) =>
    card.addEventListener("click", () => {
        const c = card.classList;
        c.toggle("expanded");
    })
);
