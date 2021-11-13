document
    .querySelector<HTMLInputElement>("#filechooser")!
    .addEventListener("input", async ({ target }) => {
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

        const canvas0 = document.querySelector<HTMLCanvasElement>("#canvas0")!;
        const canvas1 = document.querySelector<HTMLCanvasElement>("#canvas1")!;
        const canvas2 = document.querySelector<HTMLCanvasElement>("#canvas2")!;

        // オリジナル画像を描画
        canvas0.width = image.width;
        canvas0.height = image.height;
        canvas0.getContext("2d")!.drawImage(image, 0, 0);

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
        canvas1
            .getContext("2d")!
            .drawImage(
                image,
                canvasInfo.x - canvasInfo.width / 2,
                canvasInfo.y
            );

        canvas2.width = 1920 / 2;
        canvas2.height = 1080;
        copyAndScaleCanvas(canvas1, canvas2);

        binarization(canvas2, 25 * 3);

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
        r: 222,
        g: 222,
        b: 222,
    };
    const targetRGB2 = {
        // キャラ名のオレンジ
        // r: 255, g: 207, b: 4

        // Lvの数字
        // r: 255, g: 255, b: 255

        // ステータスLvの数字のふち
        r: 183,
        g: 183,
        b: 183,
    };
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
        const 和2 =
            Math.abs(r - targetRGB2.r) +
            Math.abs(g - targetRGB2.g) +
            Math.abs(b - targetRGB2.b);
        const y = (() => {
            if (和 < threshold || 和2 < threshold) {
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
