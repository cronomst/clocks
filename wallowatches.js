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
        for (i=0; i<this.MAX_PEOPLE; i++) {
            this.people.push("person" + i);
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
            pos = this.people.length * personIndex + taskIndex;
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
        elem = document.getElementById(x + ":" + y);
        label = document.getElementById("lbl:" + x + ":" + y);
        button = document.getElementById("btn:" + x + ":" + y);
        button.innerHTML = "stop";
        elem.className = "running";
        self = this;
        
        clock.intervalHandle = window.setInterval(
            function() {
                document.getElementById("lbl:" + x + ":" + y)
                    .innerHTML = self.getClock(x,y).getElapsedTime();
            }
            , 1000);

    }
    this.stopClock = function(x,y)
    {
        clock = this.getClock(x,y);
        clock.stop();
        window.clearInterval(clock.intervalHandle);
        elem = document.getElementById(x + ":" + y);
        label = document.getElementById("lbl:" + x + ":" + y);
        button = document.getElementById("btn:" + x + ":" + y);
        button.innerHTML = "start";
        label.innerHTML = clock.getElapsedTime();
        elem.className = "";
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
            th.appendChild(input);
            headerRow.appendChild(th);
        }
        for (i=0; i<this.MAX_TASKS; i++) {
            row = document.createElement("tr");
            th = document.createElement("th");
            input = document.createElement("input");
            input.id = "task" + i;
            input.onchange = this.createUpdateTaskFunc(i, input);
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
        elem = document.createElement("div");
        elem.id = x + ":" + y;
        
        label = document.createElement("div");
        label.appendChild(document.createTextNode("0:00"));
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
    
}
Persistence.write = function(wall)
{
    var clocks = wall.clocks;
    var tasks = wall.tasks;
    var people = wall.people;
    var i;
    
    for (i=0; i<people.length; i++) {
        if (people[i])
            Persistence.setCookie("person" + i, people[i]);
    }
    for (i=0; i<tasks.length; i++) {
        if (tasks[i])
            Persistence.setCookie("task" + i, tasks[i]);
    }

//    for (i=0; i<clocks.length; i++) {
//        var der
//    }
}
Persistence.getCookies = function()
{
    var cookies = document.cookie.split("; ");
    var result = {};
    var i;
    for (i=0; i<cookies.length; i++) {
        var keyValue = cookies[i].split("=");
        result[keyValue[0]] = keyValue[1];
    }
    return result;
}
Persistence.setCookie = function(key, value)
{
    document.cookie = escape(key) + "=" + escape(value);
}


var wall = new WallOWatches();
wall.init();
table = wall.createTable();
document.body.appendChild(table);

Persistence.write(wall);
