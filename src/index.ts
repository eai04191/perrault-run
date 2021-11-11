
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


    const canvas = document.querySelector<HTMLCanvasElement>("#canvas");
    const ctx = canvas.getContext('2d');

    const canvasInfo = {
        x: 0,
        y: undefined,
        width: image.width,
        height: image.width * (9 / 16)
    }
    canvasInfo.y = -(image.height - canvasInfo.height) / 2;
    console.log(canvasInfo);

    canvas.width = canvasInfo.width;
    canvas.height = canvasInfo.height;
    ctx.drawImage(image, canvasInfo.x, canvasInfo.y);




})
