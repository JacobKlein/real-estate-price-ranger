// noinspection JSUnresolvedVariable

function getVariableScript(element) {
    for (const scriptElement of element.getElementsByTagName('script')) {
        if (scriptElement.innerHTML.indexOf('var REA') === -1) {
            continue;
        }
        return scriptElement;
    }
    return null;
}

function processDetails(data) {
    const trackingDataString = data['trackingData'];
    if (trackingDataString == null) {
        console.debug("trackingData is null");
        return null;
    }
    const trackingData = JSON.parse(trackingDataString);
    if (trackingData == null
        || trackingData.listing == null
        || trackingData.listing.data == null
        || trackingData.listing.data.marketing_price_range == null) {
        console.debug("trackingData is null");
        return null;
    }
    return trackingData.listing.data.marketing_price_range;
}

function getPriceRange(data) {
    for (let i = 0; i < Object.keys(data.lexaCache).length; i++) {
        const key = Object.keys(data.lexaCache)[i];
        if (key.indexOf("$ROOT_QUERY.detailsV2") !== -1) {
            const priceRange = processDetails(data.lexaCache[key]);
            if (priceRange == null) {
                continue;
            }
            return priceRange;
        }
    }
    return null;
}

function getAdPrice(REA) {
    if (REA == null || REA.targeting == null || REA.targeting.ad_price == null) {
        return null;
    }
    return REA.targeting.ad_price;
}

function getListingPrice(REA) {
    if (REA == null || REA.targeting == null || REA.targeting.listing_price == null) {
        return null;
    }
    return REA.targeting.ad_price;
}

function getFirstElement(parentElement, className) {
    const childElement = parentElement.getElementsByClassName(className);
    return childElement.length > 0 ? childElement[0] : null;
}

// ============================================= HTML =================================== //
function addHtml(element, adPrice, listPrice, priceRange) {
    if (element == null) {
        return;
    }
    removeMessages(element);
    // Add to HTML
    if (adPrice != null) {
        element.innerHTML += "<div>AD: " + adPrice.replace("_", "-") + "</div>";
    }
    if (listPrice != null) {
        element.innerHTML += "<div>Listing: " + listPrice.replace("_", "-") + "</div>";
    }
    if (priceRange != null) {
        element.innerHTML += "<div>Range: " + priceRange.replace("_", "-") + "</div>";
    }
}

function addLoading(element) {
    if (element == null) {
        return;
    }
    removeMessages(element);
    element.innerHTML += "<div class='plugin-message'>Loading Prices</div>";
}

function removeMessages(element) {
    if (element == null) {
        return;
    }
    for (const message of element.getElementsByClassName('plugin-message')) {
        message.parentNode.removeChild(message);
    }
}

// ============================================= Process =================================== //
function runScript(scriptElement, priceElement) {
    if (scriptElement == null) {
        console.debug('Could not find REA script');
        return;
    }
    eval(scriptElement.innerHTML);
    addHtml(priceElement, getAdPrice(REA), getListingPrice(REA), getPriceRange(REA));
}

function listViewProcess(element) {
    const priceElement = getFirstElement(element, "residential-card__price");
    addLoading(priceElement);
    // Process Element
    const headings = element.getElementsByClassName('residential-card__address-heading');
    if (headings.length === 0 || headings.length > 1) {
        return;
    }
    const links = headings[0].getElementsByTagName('a');
    if (links.length === 0 || links.length > 1) {
        return;
    }
    const link = links[0].href;
    // Open property page
    const qr = new XMLHttpRequest();
    qr.open('get', link);
    qr.send();
    qr.onload = function () {
        // Load response and run script
        const externalElement = new DOMParser().parseFromString(qr.responseText, "text/html");
        runScript(getVariableScript(externalElement.body), priceElement)
    }
}

function propertyPage() {
    const priceElement = getFirstElement(document, "property-price");
    addLoading(priceElement);
    runScript(getVariableScript(document.body), priceElement)
}

function listView() {
    // Iterate and process results
    const elements = document.getElementsByClassName('results-card');
    Array.prototype.slice.call(elements).forEach(element => {
        try {
            listViewProcess(element);
        } catch (e) {
            console.log(e);
        }
    });
}


function execute() {
    if (window.location.pathname.split('/').length < 3) {
        propertyPage();
    } else {
        listView();
    }
}


execute();


