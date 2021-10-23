chrome.runtime.onMessage.addListener((param, sender, sendResponse) => {
  if (param.message === Constants.SCAN_IMAGES_ON_PAGE) {
    let imgs;
    if (param.selector) {
      let nodes = document.querySelectorAll(param.selector);
      let tags = [];
      nodes.forEach((node) => {
        tags = [...tags, ...node.getElementsByTagName("img")];
      });
      imgs = tags;
    } else {
      imgs = document.getElementsByTagName("img");
    }
    if (!imgs.length) {
      sendResponse({
        status: "fail",
        data: "",
        message: `Không có ảnh nào được tìm thấy để download. Vui lòng xem lại "Selector".`,
      });

      return;
    }

    let imgSrcs = [];
    for (let img of imgs) {
      if (img.src) {
        imgSrcs.push(img.src);
      }
    }

    sendResponse({
      status: "success",
      data: imgSrcs,
      message: "",
    });

    return;
  }

  // Response should always be sent.
  sendResponse({
    status: "fail",
    data: "",
    message: "",
  });
});
