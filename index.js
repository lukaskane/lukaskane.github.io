class Interface {
    constructor() {
        this.mapLimit = 50;
        this.colors = ["red", "#a1f1ff", "#f87dff", "green", "blue", "yellow", "black"];
        this._drawArea();
        this._drawControls();
        this.rows = document.getElementsByClassName("row");
        this.currentElement = this.getCell(this.mapLimit / 2, this.mapLimit / 2);
        this.currentElement.markChoosen();
    }

    _drawArea() {

        var root = document.getElementById("root");
        for (var i = 0; i <= this.mapLimit; i++) {
            let row = document.createElement("div");
            row.id = "row" + i;
            row.className = "row";
            root.appendChild(row);

            for (var j = 0; j <= this.mapLimit; j++) {
                var col = document.createElement("div");
                col.id = "col" + j;
                col.className = "col";
                row.appendChild(col);
            }
        }
    }

    _drawControls() {

        var color_bar = document.getElementById("controls");

        this.colors.forEach(color => {
            let color_cell = document.createElement("div");
            color_cell.id = "color_cell-" + color.replace("#", "_-dash-_");
            color_cell.className = "color_cell";
            color_cell.style.background = color.replace("_-dash-_", "#");
            color_bar.appendChild(color_cell);
        });
    }

    move(x, y) {
        var cords = this.currentElement.coordinates;
        // check for area out
        if (!this.currentElement.neighbours.up && y < 0) y = 0;
        if (!this.currentElement.neighbours.down && y > 0) y = 0;
        if (!this.currentElement.neighbours.left && x < 0) x = 0;
        if (!this.currentElement.neighbours.right && x > 0) x = 0;

        this.currentElement.markAfter();
        this.currentElement = this.getCell(cords.x + x, cords.y + y);
        this.currentElement.markChoosen();
    }
    getCell(x, y) {
        return new Cell(x, y, this);
    }
    setCurrentElement(coords) {
        this.currentElement.markAfter();
        this.currentElement = this.getCell(coords.x, coords.y);
        this.currentElement.markChoosen();
    }

    setColor(color) {
        this._AFTER = color;
    }
    clearArea() {
        for (var i = 0; i <= this.mapLimit; i++) {
            for (var j = 0; j <= this.mapLimit; j++) {
                var cell = new Cell(i, j, this).markDefault();
            }
        }
    }

}

class Cell {
    constructor(x, y, control) {
        this.rows = document.getElementsByClassName("row");
        this.cell = this._getCell(x, y);
        this._CHOOSEN = "rgb(211, 121, 230)";
        this._DEFAULT = "rgb(218, 236, 243)";
        this._AFTER = control._AFTER || "rgb(247, 230, 255)";
        this.mapLimit = control.mapLimit;
    }
    get neighbours() {
        var cords = this.coordinates;
        var upperNeighbour = cords.y > 0 ? this._getCell(cords.x, cords.y - 1) : undefined,
            lowerNeighbour = cords.y < this.mapLimit ? this._getCell(cords.x, cords.y + 1) : undefined,
            leftNeighbour = cords.x > 0 ? this._getCell(cords.x - 1, cords.y) : undefined,
            rightNeighbour = cords.x < this.mapLimit ? this._getCell(cords.x + 1, cords.y) : undefined;
        return {
            up: upperNeighbour,
            down: lowerNeighbour,
            left: leftNeighbour,
            right: rightNeighbour
        }
    }

    _getCell(x, y) {
        return this.rows[y].children[x];
    }

    setCell(el) {
        this.cell = el;
    }

    markChoosen() {
        this.cell.style.background = this._CHOOSEN;
    }

    markAfter() {
        this.cell.style.background = this._AFTER;
    }

    markDefault() {
        this.cell.style.background = this._DEFAULT;
    }

    isNew() {
        return this.cell.style.background == this._DEFAULT;
    }

    get coordinates() {
        return {
            x: +this.cell.id.match(/[\d]/g).join(""),
            y: +this.cell.parentElement.id.match(/[\d]/g).join("")
        }
    }
}


class Control {
    constructor() {
        this.isMobileDevice = navigator.userAgent.match(/Android|webOS|iPhone|iPad|iPod|BlackBerry|BB|PlayBook|IEMobile|Windows Phone|Kindle|Silk|Opera Mini/i) != null;
        this.directionMap = {
            ArrowLeft: { x: -1, y: 0 },
            ArrowRight: { x: 1, y: 0 },
            ArrowUp: { x: 0, y: -1 },
            ArrowDown: { x: 0, y: 1 }
        };
        this.interactionArea = [
            { area: "drawingArea", classes: ["col", "row"] },
            { area: "colorBar", classes: ["color_cell"] }
        ];
        this.interface = new Interface();
        if (!this.isMobileDevice)
            this.handleAction();
        else
            this.handleActionMobile();
    }
    handleAction() {
        if (!this.isMobileDevice) {
            document.addEventListener('keydown', (event) => {
                const keyName = event.key;
                if (Object.keys(this.directionMap).some(key => keyName == key)) {

                    var direction = this.directionMap[keyName];
                    this.interface.move(direction.x, direction.y);
                }
            }, false);

            document.addEventListener('mousedown', (event) => {

                // className = event.target.className;
                var classList = event.target.classList;
                if (this.getArea(classList) == "drawingArea") {

                    var path = event.path;
                    try {
                        var coords = {
                            x: path[0].id.match(/\d+/)[0],
                            y: path[1].id.match(/\d+/)[0]
                        };
                        this.interface.setCurrentElement(coords);
                    } catch (er) {
                        console.warn("unhandled area");
                    }

                } else if (this.getArea(classList) == "colorBar") {

                    Array.from(event.target.parentElement.children).forEach(el => el.classList.remove("active_color"));

                    event.target.classList.add("active_color");
                    var color = event.target.id.replace("color_cell-", "").replace("_-dash-_", "#")
                    this.interface.setColor(color);
                }
            }, false);
        }
    }
    handleActionMobile() {
        var initialPoint, finalPoint;

        document.addEventListener("touchstart", event => {
            initialPoint = event.changedTouches[0];
        }, false);

        document.addEventListener("touchend", event => {
            if (this.getArea(event.target.classList) == "drawingArea") {
                finalPoint = event.changedTouches[0];
                var xAbs = Math.abs(initialPoint.pageX - finalPoint.pageX);
                var yAbs = Math.abs(initialPoint.pageY - finalPoint.pageY);

                if (xAbs > 20 || yAbs > 20) {
                    var coords;
                    if (xAbs > yAbs) {
                        if (finalPoint.pageX < initialPoint.pageX)
                            coords = this.directionMap.ArrowLeft;
                        else
                            coords = this.directionMap.ArrowRight;
                    } else {
                        if (finalPoint.pageY < initialPoint.pageY)
                            coords = this.directionMap.ArrowUp;
                        else
                            coords = this.directionMap.ArrowDown;
                    }
                    this.interface.move(coords.x, coords.y);
                }
            } else if (this.getArea(event.target.classList) == "colorBar") {
                Array.from(event.target.parentElement.children).forEach(el => el.classList.remove("active_color"));

                event.target.classList.add("active_color");
                var color = event.target.id.replace("color_cell-", "").replace("_-dash-_", "#")
                this.interface.setColor(color);
            }

        }, false);
    }

    getArea(classList) {
        var area = this.interactionArea.find(area => {
            return area.classes.some(c => classList.contains(c));
        });
        return area ? area.area : "other";
    }
}

new Control();

// var control = new Interface();