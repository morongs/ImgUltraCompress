new Vue({
  el: "#app",
  data() {
    return {
      isPc: true,
      originalFiles: [], // 存储原始文件
      compressedImages: [], // 存储压缩后的图片数据
      compressionRatio: 60, // 默认压缩比例为60%
    };
  },
  created() {
    const os = this.getOS();
    if (os.isPc !== true) {
      this.isPc = false;
    }
    this.notify();
    // 创建防抖函数
    this.debounceCompress = this.debounce(this.compressAndDisplayImages, 100);
  },
  methods: {
    notify() {
      // const h = this.$createElement;
      // this.$notify({
      //     title: "温馨提示",
      //     type: "warning",
      //     duration: 5000,
      //     message: h('p', [
      //         "本工具GitHub地址：",
      //         h('el-link', { attrs: { type: 'primary', underline: false, href: 'https://github.com/morongs/ImgUltraCompress', target: '_blank' } }, '点击查看')
      //     ])
      // });
    },
    handleFileChange(file, fileList) {
      const isImage = file.raw.type.startsWith("image/");
      if (!isImage) {
        this.$message.error("只能上传图片格式文件！");
        return;
      }
      // 检查是否有同名文件
      const existingFile = this.originalFiles.find(
        (f) => f.name === file.raw.name
      );
      if (existingFile) {
        this.$message.error("不能上传同名的文件！");
        return;
      }
      this.originalFiles = [
        ...this.originalFiles,
        ...fileList.map((f) => f.raw),
      ];
      this.debounceCompress();
    },
    async compressAndDisplayImages() {
      this.compressedImages = []; // 清空之前的压缩结果
      const compressionRatio = (100 - this.compressionRatio) / 100;

      for (const rawFile of this.originalFiles) {
        const compressedFile = await lrz(rawFile, {
          quality: compressionRatio,
        });
        this.compressedImages.push({
          src: compressedFile.base64,
          file: compressedFile.file,
          sizeInfo: `压缩后大小: ${(compressedFile.file.size / 1024).toFixed(
            2
          )} KB`,
        });
      }
      this.updatePreview(); // 更新预览区域
    },
    updatePreview() {
      const previewContainer = document.getElementById("preview");
      previewContainer.innerHTML = ""; // 清空预览容器
      previewContainer.style.display = "flex";
      previewContainer.style.flexWrap = "wrap";
      previewContainer.style.justifyContent = "center"; // 添加此行以居中子元素
      this.compressedImages.forEach((image) => {
        const imgElement = document.createElement("img");
        imgElement.src = image.src;
        imgElement.style.maxWidth = "100%"; // 图片自适应容器宽度
        imgElement.style.height = "auto"; // 高度自适应以保持图片比例

        const sizeInfoElement = document.createElement("div");
        sizeInfoElement.classList.add("image-info");
        sizeInfoElement.innerText = image.sizeInfo;

        const container = document.createElement("div");
        if (this.isPc) {
          container.style.width = "calc(20% - 10px)"; // 宽度为20%减去内边距
        } else {
          container.style.width = "calc(50% - 10px)";
        }
        container.style.padding = "5px"; // 设置内边距
        container.style.boxSizing = "border-box"; // 边框盒模型

        container.appendChild(imgElement);
        container.appendChild(sizeInfoElement);
        previewContainer.appendChild(container);
      });
    },
    downloadCompressedImages() {
      if (this.compressedImages.length > 1) {
        var zip = new JSZip();
        var img = zip.folder("images");
        this.compressedImages.forEach((imgItem, index) => {
          const originalName = this.originalFiles[index].name;
          img.file(`compressed_${originalName}`, imgItem.file, { base64: true });
        });
        zip.generateAsync({ type: "blob" }).then(function (content) {
          // see FileSaver.js
          saveAs(content, "compressed.zip");
        });
      } else {
        this.compressedImages.forEach((image, index) => {
          const originalName = this.originalFiles[index].name;
          const downloadLink = document.createElement("a");
          downloadLink.href = image.src;
          downloadLink.download = `compressed_${originalName}`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
        });
      }
    },
    updateCompressionRatio() {
      this.debounceCompress();
    },
    debounce(func, wait) {
      let timeout;
      return function (...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          func.apply(context, args);
        }, wait);
      };
    },
    getOS() {
      let ua = navigator.userAgent,
        isWindowsPhone = /(?:Windows Phone)/.test(ua),
        isSymbian = /(?:SymbianOS)/.test(ua) || isWindowsPhone,
        isAndroid = /(?:Android)/.test(ua),
        isFireFox = /(?:Firefox)/.test(ua),
        isChrome = /(?:Chrome|CriOS)/.test(ua),
        isTablet =
          /(?:iPad|PlayBook)/.test(ua) ||
          (isAndroid && !/(?:Mobile)/.test(ua)) ||
          (isFireFox && /(?:Tablet)/.test(ua)),
        isPhone = /(?:iPhone)/.test(ua) && !isTablet,
        isPc = !isPhone && !isAndroid && !isSymbian;

      return {
        isTablet: isTablet,
        isPhone: isPhone,
        isAndroid: isAndroid,
        isPc: isPc,
      };
    },
    getBodyClass() {
      return this.isPc ? "body-center body-width-pc" : "body-center";
    },
  },
});
