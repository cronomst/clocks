var WallOWatches = function()
{
    this.MAX_PEOPLE = 7;
    this.MAX_TASKS = 9;
    
    this.clocks = [];
    this.tasks = [];
    this.people = [];
   
    this.init = function()
    {
        for (i=0; i<63; i++) {
            this.clocks.push(new Clock(i));
        }
        Persistence.read(this);
        var table = this.createTable();
        document.body.appendChild(table);
        
        for (y=0; y<this.MAX_PEOPLE; y++) {
            for (x=0; x<this.MAX_TASKS; x++) {
                this.updateClockDisplay(x, y);
            }
        }
    }

    this.addPerson = function(name)
    {
        this.people.push(name);
    }
    
    this.addTask = function(name)
    {
        this.tasks.push(name);
    }
    
    this.getClockByName = function(person, task)
    {
        personIndex = this.people.indexOf(person);
        taskIndex = this.tasks.indexOf(task);
        
        return this.getClock(personIndex, taskIndex);
    }
    
    this.getClock = function(personIndex, taskIndex)
    {
        if (personIndex >= 0 && taskIndex >= 0) {
            pos = this.MAX_PEOPLE * personIndex + taskIndex;
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
            elem.className = "";
        }
    }
    
    this.createTable = function()
    {
        var i;
        var input;
        var table = document.createElement("table");
        table.setAttribute("border", "1");
        
        headerRow = document.createElement("tr");
        headerRow.appendChild(document.createElement("th"));
        table.appendChild(headerRow);
        for (i=0; i<this.MAX_PEOPLE; i++) {
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
        for (i=0; i<this.MAX_TASKS; i++) {
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
            for (j=0; j<this.MAX_PEOPLE; j++) {
                td = document.createElement("td");
                td.appendChild(this.createClockElement(i, j));
                row.appendChild(td);
            }
        }
        return table;
    }
    
    this.createClockElement = function(x,y)
    {
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
        var self = this;
        return function() {
           self.people[key] = input.value;
           Persistence.write(self);
        }
    }
    
    this.createUpdateTaskFunc = function(key, input)
    {
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
    var i;
    var cookies = Persistence.getAllItems();
    for (i=0; i<wall.MAX_PEOPLE; i++) {
        if (cookies["person" + i]) {
            wall.people[i] = cookies["person" + i];
        }
    }
    
    for (i=0; i<wall.MAX_TASKS; i++) {
        if (cookies["task" + i]) {
            wall.tasks[i] = cookies["task" + i];
        }
    }
    
    var clockJson = cookies["clocks"];
    if (typeof clockJson !== 'undefined') {
        var clockData = JSON.parse(clockJson);
        for (i=0; i<clockData.length; i++) {
            wall.clocks[clockData[i].id].startTime = clockData[i].start;
            wall.clocks[clockData[i].id].accumulatedTime = clockData[i].accum;
            wall.clocks[clockData[i].id].running = clockData[i].running;
            wall.clocks[clockData[i].id].id = clockData[i].id;
        }
    }
}
Persistence.write = function(wall)
{
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
    wall.clocks = [];
    Persistence.write(wall);
}
document.body.appendChild(clearBtn);

var clearAll = document.createElement("button");
clearAll.innerHTML = "Clear everything";
clearAll.onclick = Persistence.clearData;
document.body.appendChild(clearAll);