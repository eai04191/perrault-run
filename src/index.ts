import { rectangles, rectangles4K, rectangles4KLv } from "./rectangles";
import {
    canvas0,
    canvas1,
    canvas2,
    canvas3,
    ctx0,
    ctx1,
    ctx3,
    filechooser,
    loading,
    appendResult,
    resetResult,
} from "./ui";
import { opencvjsReady, tesseractjsReady } from "./loading";

import { createWorker } from "tesseract.js";
// @ts-ignore
import opencvjs, { CV } from "@techstark/opencv-js";
const cv = opencvjs as CV;

cv.onRuntimeInitialized = () => {
    opencvjsReady();
};

const worker = createWorker();
(async () => {
    await worker.load();
    await worker.loadLanguage("eng");
    await worker.initialize("eng");
    await worker.setParameters({
        tessedit_char_whitelist: "0123456789",
    });
    tesseractjsReady();
    filechooser.removeAttribute("disabled");
})();

filechooser.addEventListener("input", async ({ target }) => {
    resetResult();

    const t = target as HTMLInputElement;
    const { files } = t;

    // ファイルなければ中止
    if (!files || files.length === 0) return;

    const file = files[0];

    // 画像じゃなければ中止
    if (!file.type.match(/^image\/(png|jpeg|gif)$/)) {
        alert("file is not image!");
        return;
    }

    const dataURL = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const result = event.target?.result;

            if (typeof result !== "string") {
                // 軟骨うますぎ祭り開催中止
                reject("dataURL should be string");
                return;
            }
            resolve(result);
        };
        reader.readAsDataURL(file);
    });

    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            resolve(img);
        };
        img.onerror = (e) => {
            reject(e);
        };
        img.src = dataURL;
    });

    // TODO: クロップ処理
    // Galaxyにある#000000の余白とか
    // 余裕があればAndroidエミュレーターのUI部分も

    // オリジナル画像を描画
    canvas0.width = image.width;
    canvas0.height = image.height;
    ctx0.drawImage(image, 0, 0);

    const canvasInfo = (() => {
        if (image.width / image.height <= 16 / 9) {
            // 16:9か
            // 16:9より縦長
            const height = image.width * (9 / 16);
            return {
                x: 0,
                y: -(image.height - height) / 2,
                width: image.width,
                height: height,
            };
        } else {
            // 16:9より横長
            const width = image.height * (16 / 9);
            return {
                // 右端
                x: -(image.width - width),
                y: 0,
                width: width,
                height: image.height,
            };
        }
    })();

    // console.log("canvas info", canvasInfo);
    // canvas.width = canvasInfo.width;
    canvas1.height = canvasInfo.height;
    // ctx.drawImage(image, canvasInfo.x, canvasInfo.y);

    // 右半分だけ抽出
    canvas1.width = canvasInfo.width / 2;
    ctx1.drawImage(image, canvasInfo.x - canvasInfo.width / 2, canvasInfo.y);

    // canvas2.width = 1920 / 2;
    // canvas2.height = 1080;
    canvas2.width = (1920 / 2) * 2;
    canvas2.height = 1080 * 2;
    copyAndScaleCanvas(canvas1, canvas2);

    // copy
    // canvas3.width = 1920 / 2;
    // canvas3.height = 1080;
    canvas3.width = (1920 / 2) * 2;
    canvas3.height = 1080 * 2;
    ctx3.drawImage(canvas2, 0, 0);

    binarization(canvas3, 50 * 3);

    loading.classList.remove("hidden");

    for (let i = 0; i < rectangles4K.length; i++) {
        const {
            data: { text },
        } = await worker.recognize(canvas3, {
            rectangle: rectangles4K[i],
        });
        appendResult(`${rectangles4K[i].label}: ${text}`);
        loading.classList.add("hidden");
    }

    // await worker.terminate();

    // TODO: Lv検出, 誓約検出, キャラ名検出, ランク検出, ステータスOCR, アイテム検出
});

/**
 * sourceCanvasをtargetCanvasのwidth, heightに沿うようにscaleしたtargetCanvasに描画する
 * アスペクト比が違う場合の動作はサポートされていない
 */
function copyAndScaleCanvas(
    sorceCanvas: HTMLCanvasElement,
    targetCanvas: HTMLCanvasElement
) {
    const aimedWidth = targetCanvas.width;
    const aimedHeight = targetCanvas.height;

    targetCanvas.setAttribute("width", aimedWidth.toString());
    targetCanvas.setAttribute("height", aimedHeight.toString());
    // 目標値への拡縮倍率。いい名前が思いつかない
    const n = aimedHeight / sorceCanvas.height;
    targetCanvas.getContext("2d")!.scale(n, n);
    targetCanvas.getContext("2d")!.drawImage(sorceCanvas, 0, 0);
}

function binarization(canvas: HTMLCanvasElement, threshold: number) {
    const targetRGB = {
        // キャラ名のオレンジ
        // r: 255, g: 207, b: 4

        // Lvの数字
        // r: 255, g: 255, b: 255

        // ステータスLvの数字
        r: 218,
        g: 218,
        b: 218,
    };
    // const targetRGB2 = {
    //     // キャラ名のオレンジ
    //     // r: 255, g: 207, b: 4

    //     // Lvの数字
    //     // r: 255, g: 255, b: 255

    //     // ステータスLvの数字のふち
    //     r: 140,
    //     g: 140,
    //     b: 140,
    // };
    const c = canvas.getContext("2d")!;
    const src = c.getImageData(0, 0, canvas.width, canvas.height);
    const dst = c.createImageData(canvas.width, canvas.height);

    // 1px(RGBA)ずつ処理する
    for (let i = 0; i < src.data.length; i += 4) {
        const r = src.data[i];
        const g = src.data[i + 1];
        const b = src.data[i + 2];
        const a = src.data[i + 3];

        const 和 =
            Math.abs(r - targetRGB.r) +
            Math.abs(g - targetRGB.g) +
            Math.abs(b - targetRGB.b);
        // const 和2 =
        //     Math.abs(r - targetRGB2.r) +
        //     Math.abs(g - targetRGB2.g) +
        //     Math.abs(b - targetRGB2.b);
        const y = (() => {
            // if (和 < threshold || 和2 < threshold) {
            if (和 < threshold) {
                return 255;
            }
            return 0;
        })();

        dst.data[i] = y;
        dst.data[i + 1] = y;
        dst.data[i + 2] = y;
        dst.data[i + 3] = a;
    }
    c.putImageData(dst, 0, 0);
}
