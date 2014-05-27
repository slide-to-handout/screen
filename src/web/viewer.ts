///<reference path="../../DefinitelyTyped/pdf/pdf.d.ts" />
///<reference path="../../DefinitelyTyped/socket.io-client/socket.io-client.d.ts" />
"use strict";

declare var io: any;  // workaround

var url = '/static/Sphinx.pdf';

class SlideScreen {
    private pdfDoc: PDFDocumentProxy;
    private pageNum: number;
    private scale: number;
    private canvas: HTMLCanvasElement;
    private ctx;

    constructor(canvasId: string) {
        this.scale = 1;
        this.canvas = <HTMLCanvasElement>document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
    }

    load(url: string) {
        var self = this;
        // Asynchronously download PDF as an ArrayBuffer
        PDFJS.getDocument(url).then(function (pdf: PDFDocumentProxy) {
            self.pdfDoc = pdf;
            self.setPageNum(1);
        }, function(err) {
            console.log(err);
        });
    }

    setPageNum(page: number) {
        page = page | 0;  // convert to int
        if (1 <= page && page <= this.pdfDoc.numPages) {
            this.pageNum = page;
            this.renderPage();
        }
    }

    // Get page info from document, resize canvas accordingly, and render page
    renderPage() {
        if (!this.pdfDoc) {
            console.log("pdf isn't loaded yet.");
        }
        var num = this.pageNum;
        var self = this;
        // Using promise to fetch the page
        this.pdfDoc.getPage(num).then(function(page) {
            var viewport = page.getViewport(self.scale);
            self.canvas.height = viewport.height;
            self.canvas.width = viewport.width;

            document.getElementById('page_num').textContent = num.toString();
            document.getElementById('page_count').textContent = self.pdfDoc.numPages.toString();

            // Render PDF page into canvas context
            var renderContext = {
                canvasContext: self.ctx,
                viewport: viewport
            };
            page.render(renderContext);
        });
        // Update page counters
    }

    goPrevious() {
        if (this.pageNum > 1) {
            --this.pageNum;
            this.renderPage();
        }
    }

    goNext() {
        if (this.pdfDoc && this.pageNum < this.pdfDoc.numPages) {
            ++this.pageNum;
            this.renderPage();
        }
    }
}

enum VK {
    LEFT = 37,
    UP = 38,
    RIGHT = 39,
    DOWN = 40,
}

(function () {
    "use strict";

    var screen = new SlideScreen('the-canvas');
    screen.load(url);

    document.addEventListener("keydown", function (e: KeyboardEvent) {
        switch (e.which) {
            case VK.LEFT: screen.goPrevious(); break;
            case VK.RIGHT: screen.goNext(); break;
        }
    }, false);

    var socket = io.connect('/screen');

    socket.on('connect', function () {
        console.log('connected via socket.io');
    });

    socket.on('move_page', function (params: {page: number}) {
        console.log(params);
        var page = params.page;
        screen.setPageNum(page);
    });

})();
