///<reference path="../../DefinitelyTyped/pdf/pdf.d.ts" />
///<reference path="../../DefinitelyTyped/socket.io-client/socket.io-client.d.ts" />
"use strict";

declare var io: any;  // workaround

var url = '/static/Sphinx.pdf';

var pdfDoc: PDFDocumentProxy,
    pageNum = 1,
    scale = 1,
    canvas = <HTMLCanvasElement>document.getElementById('the-canvas'),
    ctx = canvas.getContext('2d');

var socket = io.connect('/screen');

// Get page info from document, resize canvas accordingly, and render page
function renderPage(num: number) {
    if (!pdfDoc) {
        console.log("pdf isn't loaded yet.");
    }
    // Using promise to fetch the page
    pdfDoc.getPage(num).then(function(page) {
        var viewport = page.getViewport(scale);
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        document.getElementById('page_num').textContent = pageNum.toString();
        document.getElementById('page_count').textContent = pdfDoc.numPages.toString();

        // Render PDF page into canvas context
        var renderContext = {
            canvasContext: ctx,
            viewport: viewport
        };
        page.render(renderContext);
    });
    // Update page counters
}

// Asynchronously download PDF as an ArrayBuffer
PDFJS.getDocument(url).then(function (pdf: PDFDocumentProxy) {
    pdfDoc = pdf;
    pageNum = 1;
    renderPage(pageNum);
}, function(err) {
    console.log(err);
});

function goPrevious() {
    if (pageNum > 1) {
        --pageNum;
        renderPage(pageNum);
    }
}

function goNext() {
    if (pdfDoc && pageNum < pdfDoc.numPages) {
        ++pageNum;
        renderPage(pageNum);
    }
}

var VK = {
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40
};

document.addEventListener("keydown", function (e: KeyboardEvent) {
    switch (e.which) {
        case VK.LEFT: goPrevious(); break;
        case VK.RIGHT: goNext(); break;
    }
}, false);

socket.on('connect', function () {
    console.log('connected via socket.io');
});

socket.on('move_page', function (params: {page: number}) {
    console.log(params);
    var page = params.page;
    if (1 <= page && page <= pdfDoc.numPages) {
        pageNum = page;
        renderPage(pageNum);
    }
});
