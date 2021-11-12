document.querySelector<HTMLInputElement>('#filechooser').addEventListener('input', async ({ target }) => {
    const t = target as HTMLInputElement;
    const { files } = t;

    // ファイルなければ中止
    if (files.length === 0) return;

    const file = files[0];

    // 画像じゃなければ中止
    if (!file.type.match(/^image\/(png|jpeg|gif)$/)) {
        alert('file is not image!');
        return;
    }

    const dataURL = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const result = event.target.result;

            if (typeof result !== 'string') {
                // 軟骨うますぎ祭り開催中止
                reject('dataURL should be string');
                return;
            }
            resolve(result);
        }
        reader.readAsDataURL(file);
    });

    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            resolve(img);
        }
        img.onerror = (e) => {
            reject(e);
        }
        img.src = dataURL;
    });

    // TODO: クロップ処理
    // Galaxyにある#000000の余白とか
    // 余裕があればAndroidエミュレーターのUI部分も

    const canvas = document.querySelector<HTMLCanvasElement>("#canvas");
    const ctx = canvas.getContext('2d');
    // FIXME: x, yがanyになる
    const canvasInfo = (() => {
        if (image.width / image.height <= 16 / 9) {
            // 16:9か
            // 16:9より縦長
            const height = image.width * (9 / 16)
            return {
                x: 0,
                y: -(image.height - height) / 2,
                width: image.width,
                height: height
            }
        } else {
            // 16:9より横長
            const width = image.height * (16 / 9)
            return {
                // 右端
                x: -(image.width - width),
                y: 0,
                width: width,
                height: image.height,
            }
        }
    })()

    console.log("canvas info", canvasInfo);
    // canvas.width = canvasInfo.width;
    canvas.height = canvasInfo.height;
    // ctx.drawImage(image, canvasInfo.x, canvasInfo.y);

    // 右半分だけ抽出
    canvas.width = canvasInfo.width / 2;
    ctx.drawImage(image, canvasInfo.x - canvasInfo.width / 2, canvasInfo.y);


    binarization(canvas, 105)

    // TODO: Lv検出, 誓約検出, キャラ名検出, ランク検出, ステータスOCR, アイテム検出
})

/**
 * 与えられたスレッショルドでcanvasのcontextを二値化する
 * @license MIT License
 * @preserve Copyright (c) 2019 Yoshiki Shinagawa
 * @see https://tech-blog.s-yoshiki.com/entry/114
 * @see https://github.com/s-yoshiki/Gasyori100knockJS/blob/master/src/components/questions/answers/Ans3.js
 */
function binarization(canvas: HTMLCanvasElement, threshold: number) {
    const context = canvas.getContext('2d');
    const src = context.getImageData(0, 0, canvas.width, canvas.height)
    const dst = context.createImageData(canvas.width, canvas.height)
    for (let i = 0; i < src.data.length; i += 4) {
        let y = 0.2126 * src.data[i] + 0.7152 * src.data[i + 1] + 0.0722 * src.data[i + 2]
        if (y > threshold) {
            y = 255
        } else {
            y = 0
        }
        dst.data[i] = y
        dst.data[i + 1] = y
        dst.data[i + 2] = y
        dst.data[i + 3] = src.data[i + 3]
    }
    context.putImageData(dst, 0, 0)
}
