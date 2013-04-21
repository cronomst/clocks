var WallOWatches = function()
{
    this.MAX_COLUMNS = 9;
    this.MAX_ROWS = 8;
    
    this.clocks = [];
    this.tasks = [];
    this.people = [];
   
    this.init = function()
    {
        for (i=0; i<this.MAX_COLUMNS * this.MAX_ROWS; i++) {
            this.clocks.push(new Clock(i));
        }
        Persistence.read(this);
        var table = this.createTable();
        document.body.appendChild(table);
        
        for (y=0; y<this.MAX_COLUMNS; y++) {
            for (x=0; x<this.MAX_ROWS; x++) {
                this.updateClockDisplay(x, y);
            }
        }
    }
    
    this.get2Dto1D = function(x, y)
    {
        /// Converts from 2D to 1D coordinates
        return this.MAX_COLUMNS * x + y;
    }
    

    this.getClock = function(personIndex, taskIndex)
    {
        if (personIndex >= 0 && taskIndex >= 0) {
            pos = this.get2Dto1D(personIndex, taskIndex);
            if (typeof this.clocks[pos] === 'undefined') {
                this.clocks[pos] = new Clock(pos);
            }
            return this.clocks[pos];
        }
        return false;
    }
    
    this.toggleClock = function(x,y)
    {
        clock = this.getClock(x,y);
        if (clock.running) {
            this.stopClock(x,y);
        } else {
            this.startClock(x,y);
        }
    }
    
    this.startClock = function(x,y)
    {
        clock = this.getClock(x,y);
        clock.start();
        Persistence.write(this);
        this.updateClockDisplay(x, y);

    }
    this.stopClock = function(x,y)
    {
        clock = this.getClock(x,y);
        clock.stop();
        Persistence.write(this);
        this.updateClockDisplay(x, y);
    }
    
    this.updateClockDisplay = function(x,y)
    {
        clock = this.getClock(x,y);
        elem = document.getElementById(x + ":" + y);
        label = document.getElementById("lbl:" + x + ":" + y);
        button = document.getElementById("btn:" + x + ":" + y);
        if (clock.running) {
            button.innerHTML = "stop";
            elem.className = "running";
            self = this;

            clock.intervalHandle = window.setInterval(
                function() {
                    document.getElementById("lbl:" + x + ":" + y)
                        .innerHTML = self.getClock(x,y).getElapsedTime();
                }
                , 1000);
        } else {
            window.clearInterval(clock.intervalHandle);
            button.innerHTML = "start";
            label.innerHTML = clock.getElapsedTime();
            if (clock.accumulatedTime > 0) {
                elem.className = "suspended";
            } else {
                elem.className = "";
            }
        }
    }
    
    this.createTable = function()
    {
        /// Creates the entire table representing the wall of clocks
        var i;
        var input;
        var table = document.createElement("table");
        
        headerRow = document.createElement("tr");
        headerRow.appendChild(document.createElement("th"));
        table.appendChild(headerRow);
        for (i=0; i<this.MAX_COLUMNS; i++) {
            var th = document.createElement("th");
            input = document.createElement("input");
            input.id = "person" + i;
            input.onchange = this.createUpdatePersonFunc(i, input);
            if (this.people[i]) {
                input.value = this.people[i];
            }
            th.appendChild(input);
            headerRow.appendChild(th);
        }
        for (i=0; i<this.MAX_ROWS; i++) {
            row = document.createElement("tr");
            th = document.createElement("th");
            input = document.createElement("input");
            input.id = "task" + i;
            input.onchange = this.createUpdateTaskFunc(i, input);
            if (this.tasks[i]) {
                input.value = this.tasks[i];
            }
            th.appendChild(input);
            row.appendChild(th);
            table.appendChild(row);
            for (j=0; j<this.MAX_COLUMNS; j++) {
                td = document.createElement("td");
                td.appendChild(this.createClockElement(i, j));
                row.appendChild(td);
            }
        }
        return table;
    }
    
    this.createClockElement = function(x,y)
    {
        /// Creates an element containing a time and button for the clock
        /// at the given coordinates.
        clock = this.getClock(x,y);
        elem = document.createElement("div");
        elem.id = x + ":" + y;
        
        label = document.createElement("div");
        label.appendChild(document.createTextNode(clock.getElapsedTime()));
        label.id = "lbl:" + elem.id;
        
        button = document.createElement("button");
        button.appendChild(document.createTextNode("start"));
        wall = this;
        button.onclick = function() {
            wall.toggleClock(x,y);
        }
        button.id = "btn:" + elem.id;
        
        elem.appendChild(label);
        elem.appendChild(button);
        return elem;
    }
    
    this.createUpdatePersonFunc = function(key, input)
    {
        /// Creates a callback used to update a person name in persistence
        var self = this;
        return function() {
           self.people[key] = input.value;
           Persistence.write(self);
        }
    }
    
    this.createUpdateTaskFunc = function(key, input)
    {
        /// Creates a callback used to update the task name in persistence
        var self = this;
        return function() {
            self.tasks[key] = input.value;
            Persistence.write(self);
        }
    }
}


var Clock = function(id)
{
    this.startTime = 0;
    this.accumulatedTime = 0;
    this.running = false;
    this.intervalHandle = null;
    this.id = id;
    
    this.start = function()
    {
        this.startTime = Date.now();
        this.running = true;
    }
    
    this.stop = function()
    {
        this.accumulatedTime += Date.now() - this.startTime;
        this.running = false;
    }
    
    this.getElapsedTime = function()
    {
        /// Returns the string representation of the elapsed time in
        /// the format minutes:seconds.
        ms = this.accumulatedTime;
        if (this.running) {
            ms += Date.now() - this.startTime;
        }
        minutes = Math.floor(ms / 60000);
        seconds = Math.floor(ms / 1000 % 60);
        if (seconds < 10)
            seconds = "0" + seconds;
        
        return minutes + ":" + seconds;
    }
}

var Persistence = function() {}
Persistence.read = function(wall)
{
    /// Reads the stored state into the given wall
    var i;
    var items = Persistence.getAllItems();
    for (i=0; i<wall.MAX_COLUMNS; i++) {
        if (items["person" + i]) {
            wall.people[i] = items["person" + i];
        }
    }
    
    for (i=0; i<wall.MAX_ROWS; i++) {
        if (items["task" + i]) {
            wall.tasks[i] = items["task" + i];
        }
    }
    
    var clockJson = items["clocks"];
    if (typeof clockJson !== 'undefined') {
        var clockData = JSON.parse(clockJson);
        for (i=0; i<clockData.length; i++) {
            console.log(i + "=" + clockData[i].id);
            wall.clocks[clockData[i].id].startTime = clockData[i].start;
            wall.clocks[clockData[i].id].accumulatedTime = clockData[i].accum;
            wall.clocks[clockData[i].id].running = clockData[i].running;
            wall.clocks[clockData[i].id].id = clockData[i].id;
        }
    }
}
Persistence.write = function(wall)
{
    /// Writes the current state for the given wall
    var clocks = wall.clocks;
    var tasks = wall.tasks;
    var people = wall.people;
    var i;
    
    for (i=0; i<people.length; i++) {
        if (typeof people[i] !== 'undefined')
            Persistence.setItem("person" + i, people[i]);
    }
    for (i=0; i<tasks.length; i++) {
        if (typeof tasks[i] !== 'undefined')
            Persistence.setItem("task" + i, tasks[i]);
    }
    
    var clockData = [];
    for (i=0; i<clocks.length; i++) {
        if (clocks[i].running || clocks[i].accumulatedTime > 0) {
            clockData.push( {
                "start": clocks[i].startTime,
                "accum": clocks[i].accumulatedTime,
                "running" : clocks[i].running,
                "id": clocks[i].id
            });
        }
    }
    
    var clocksJson = JSON.stringify(clockData);
    Persistence.setItem("clocks", clocksJson);
}
Persistence.getAllItems = function()
{
    /// Returns all items in persistence as key/value pairs
    var result = {};
    var i;
    for (i=0; i<localStorage.length; i++) {
        var key = localStorage.key(i);
        var value = localStorage.getItem(key);
        result[key] = value;
    }
    return result;
}
Persistence.setItem = function(key, value)
{
    localStorage.setItem(key, value);
}
Persistence.clearData = function()
{
    /// Erases all persistence data
    var keys = [];
    var i;
    for (i=0; i<localStorage.length; i++) {
        keys.push(localStorage.key(i));
    }
    for (i=0; i<keys.length; i++) {
        localStorage.removeItem(keys[i]);
    }    
}

var wall = new WallOWatches();
wall.init();

var clearBtn = document.createElement("button");
clearBtn.innerHTML = "Clear times";
clearBtn.onclick = function() {
    var conf = confirm("Erase all time data?");
    if (conf) {
        wall.clocks = [];
        Persistence.write(wall);
        location.reload();
    }
}
document.body.appendChild(clearBtn);

var clearAll = document.createElement("button");
clearAll.innerHTML = "Clear everything";
clearAll.onclick = function() {
    var conf = confirm("Are you sure you want to erase all time AND name data?")
    if (conf) {
        Persistence.clearData();
        location.reload();
    }
}
document.body.appendChild(clearAll);