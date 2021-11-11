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
            const canvasInfo = {
                x: 0,
                y: undefined,
                width: image.width,
                height: image.width * (9 / 16)
            }
            canvasInfo.y = -(image.height - canvasInfo.height) / 2;
            return canvasInfo;
        } else {
            // 16:9より横長
            const canvasInfo = {
                x: undefined,
                y: 0,
                width: image.height * (16 / 9),
                height: image.height,
            }
            // 右端
            canvasInfo.x = -(image.width - canvasInfo.width);
            return canvasInfo;
        }
    })()

    console.log("canvas info", canvasInfo);
    canvas.width = canvasInfo.width;
    canvas.height = canvasInfo.height;
    ctx.drawImage(image, canvasInfo.x, canvasInfo.y);

    // TODO: Lv検出, 誓約検出, キャラ名検出, ランク検出, ステータスOCR, アイテム検出
})
