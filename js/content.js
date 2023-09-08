const likeFunction = () => {
    const buttonXpath = '//*[@id="segmented-like-button"]/ytd-toggle-button-renderer/yt-button-shape/button';
    const buttonResult = document.evaluate(buttonXpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    const likeButton = buttonResult.singleNodeValue;

    if (likeButton) {
        if (likeButton.getAttribute('aria-pressed') === 'false') {
            likeButton.click();
        } else {
            console.log('Button is already pressed');
        }
    } else {
        console.error('Like button not found');
    }
};

window.setTimeout(likeFunction, 10000);
