const startTime = performance.now();
const ready = (element: HTMLLIElement) => {
    const time = Math.floor(performance.now() - startTime) + "ms";
    element.querySelector("span")!.innerText = time;
    element.classList.add("loaded");
};

export const tesseractjsReady = () => {
    const element = document.querySelector<HTMLLIElement>("#tesseract-js")!;
    ready(element);
};

export const opencvjsReady = () => {
    const element = document.querySelector<HTMLLIElement>("#opencv-js")!;
    ready(element);
};
