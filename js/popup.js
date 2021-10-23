window.onload = function () {
  document.getElementById("btn-get-imgs").onclick = getImages;
  document.getElementById("btn-download").onclick = downloadImages;

  let selector = document.getElementById("selector");
  let fileName = document.getElementById("fileName");
  let folderName = document.getElementById("folderName");

  let fields = {selector, fileName, folderName};

  for (const property in fields) {
    fields[property].addEventListener("change", () => {
      chrome.storage.sync.set({[property]: fields[property].value});
    });
  }
  
  chrome.storage.sync.get(Object.keys(fields), (result) => {
    for (const property in fields) {
      if (result[property]) {
        fields[property].value = result[property];
      }
    }
  });
};

getImages = () => {
  chrome.tabs.query(
    {
      active: true,
      currentWindow: true,
      lastFocusedWindow: true,
    },
    function (tabs) {
      var tab = tabs[0];
      if (tab) {
        chrome.tabs.sendMessage(
          tab.id,
          {
            message: Constants.SCAN_IMAGES_ON_PAGE,
            selector: document.getElementById("selector").value,
          },
          {},
          (response) => {
            if (window.chrome.runtime.lastError) {
              alert(
                ` Reload lại trang web đang muốn tải ảnh và click download lại. ${window.chrome.runtime.lastError.message}`
              );
              return;
            }
            if (response && response.status === "success") {
              let imgsSrc = response.data;
              imgsSrc.reverse();
              let imagesContainer = document.getElementById("images-container");
              imagesContainer.innerHTML = "";
              imgsSrc.forEach((imgSrc, index) => {
                let imgNode = document.createElement("img");
                imgNode.src = imgSrc;
                imgNode.onclick = function () {
                  if (this.getAttribute("data-is-selected") === "true") {
                    this.dataset.isSelected = false;
                  } else {
                    this.dataset.isSelected = true;
                  }
                };
                imagesContainer.insertBefore(
                  imgNode,
                  imagesContainer.childNodes[0]
                );
              });
            } else {
              alert(response.message);
            }
          }
        );
      } else {
        alert("Reload page and click me again.");
      }
    }
  );
};

downloadImages = () => {
  let downloadBtn = document.getElementById("btn-download");
  downloadBtn.innerHTML = "Downloading";
  downloadBtn.disabled = true;
  let selectedImgNodes = document.querySelectorAll(
    "img[data-is-selected=true]"
  );

  if (!selectedImgNodes.length) {
    selectedImgNodes = document.querySelectorAll("img");
  }

  if (!selectedImgNodes.length) {
    downloadBtn.innerHTML = "Download";
    downloadBtn.disabled = false;
    alert(
      "Không tìm thấy ảnh nào trên website. Hãy thực hiện quét ảnh trên trang trước và thử lại."
    );
    return;
  }

  let imgSrcs = [];
  for (let img of selectedImgNodes) {
    if (img.src) {
      imgSrcs.push(img.src);
    }
  }

  downloadMany(imgSrcs).then((res) => {
    let prefixFileName = document.getElementById("fileName").value;
    let folderName = document.getElementById("folderName").value;
    if (!folderName) {
      folderName = "image_downloader";
    }

    let zip = new JSZip();
    zip.folder(folderName);
    res.forEach((blob, index) => {
      let fileExtension = "";
      switch (blob.type) {
        case "image/apng":
          fileExtension = "apng";
          break;
        case "image/avif":
          fileExtension = "avif";
          break;
        case "image/gif":
          fileExtension = "gif";
          break;
        case "image/jpeg":
          fileExtension = "jpeg";
          break;
        case "image/png":
          fileExtension = "png";
          break;
        case "image/svg+xml":
          fileExtension = "svg";
          break;
        case "image/webp":
          fileExtension = "webp";
          break;
        default:
          fileExtension = "jpeg";
          break;
      }

      let fileName;
      if (prefixFileName) {
        fileName = `${folderName}/${prefixFileName}${
          index + 1
        }.${fileExtension}`;
      } else {
        fileName = `${folderName}/${index + 1}.${fileExtension}`;
      }
      zip.file(fileName, blob);
    });

    zip
      .generateAsync({ type: "blob" })
      .then((content) => {
        saveAs(content, `${folderName}.zip`);
        downloadBtn.innerHTML = "Download";
        downloadBtn.disabled = false;
      })
      .catch((error) => {
        downloadBtn.innerHTML = "Download";
        downloadBtn.disabled = false;
        alert(
          `Xảy ra lỗi khi nén file, vui lòng làm mới trang và thử lại. ${error.message}`
        );
      });
  });
};

/**
 *
 * @param {string} url
 * @returns blob
 */
const download = (url) => {
  return fetch(url).then((res) => {
    return res.blob();
  });
};

/**
 *
 * @param {string[]} urls
 * @returns array of blobs
 */
const downloadMany = (urls) => {
  return Promise.all(urls.map((url) => download(url)));
};
