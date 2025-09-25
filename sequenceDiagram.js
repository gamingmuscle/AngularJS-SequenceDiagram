/*
	sequenceDiagram.js
	v0.0.1
*/
let diagram = function () 
{
	this.ns = "http://www.w3.org/2000/svg";
	this.actors=[];
	this.actorsPos={};
	this.signals=[];
	this.title=null;
	this.textSize=16;
	this.signalHeight=24;
	this.signalBuffer=5;
	this.minXGap=32;
	this.minHeight=24;
	this.minWidth=50;
	this.wrappers={};
	this.classRoot="squncDgrm"
	this.dClass={actor:[],signal:[]};
	this.markers={left:createMarker(this,document.createElementNS(this.ns,'marker'),"M 10 0 L 0 5 L 10 10 Z",0,5),right:createMarker(this,document.createElementNS(this.ns,'marker'),"M 0 0 L 10 5 L 0 10 Z",10,5)};
	this.markers.left.setAttribute("id","leftArrow");
	this.markers.right.setAttribute("id","rightArrow");
	this.filter=createFilter(this,document.createElementNS(this.ns,'filter'));
	function createMarker($this,marker,moveToPath,x,y)
	{	
		marker.setAttribute("markerWidth",5);
		marker.setAttribute("markerHeight",8);
		marker.setAttribute("viewBox","0 0 10 10");
		marker.setAttribute("refX",x);
		marker.setAttribute("refY",y);
		marker.setAttribute("class","squncDgrm-marker_arrow");
		path=document.createElementNS($this.ns,'path');
		path.setAttribute("d",moveToPath);
		marker.appendChild(path);

		return marker;
	}
	function createFilter($this,filter)
	{
		filter.setAttribute('id','dropshadow');
		filter.setAttribute('height','130%');
		fgb=document.createElementNS($this.ns,'feGaussianBlur');
		fgb.setAttribute('in','SourceAlpha');
		fgb.setAttribute('stdDeviation',3);
		fo=document.createElementNS($this.ns,'feOffset');
		fo.setAttribute('dx',2);
		fo.setAttribute('dx',2);
		fo.setAttribute('result','offsetblur');
		fct=document.createElementNS($this.ns,'feComponentTransfer');
		ffa=document.createElementNS($this.ns,'feFuncA');
		ffa.setAttribute('type','linear');
		ffa.setAttribute('slope',0.5);
		fct.appendChild(ffa);
		fm=document.createElementNS($this.ns,'feMerge');
		fm.appendChild(document.createElementNS($this.ns,'feMergeNode'));
		fmn=document.createElementNS($this.ns,'feMergeNode');
		fmn.setAttribute("in","SourceGraphic");
		fm.appendChild(fmn);
		filter.appendChild(fgb);
		filter.appendChild(fo);
		filter.appendChild(fct);
		filter.appendChild(fm);
		return filter;
	}
}
diagram.signal = function(signal,a,b,message)
{
	this.setProperty=function(key,value)
	{
		$this[key]=value;
	};
	$this=this;
	this.actorA=a;
	this.actorB=b;
	this.message=message;
	t=0;
	if(signal[0]=="<")
		t+=1;
	if(signal[signal.length-1]==">")
		t+=2;
	switch(t)
	{
		case 0: this.setProperty('direction',"none");
			break;
		case 1: this.setProperty('direction',"left");
			break;
		case 2: this.setProperty('direction',"right");
			break;
		case 3: this.setProperty('direction',"bi");
			break;
	}
	if(signal.length==3)
		this.setProperty('dashed',true);
	
};
diagram.actor = function(key,name)
{
	this.key=key;
	this.name=name;
	this.setProperty=function (key,value)
	{
		this[key]=value;
	};
};

diagram.prototype.getActor = function(key,actor)
{
	if(typeof this.actors == "undefined")this.actors=[];
	if(typeof this.actors[this.actorsPos[key]] != "undefined") return this.actors[this.actorsPos[key]];
	else if(typeof actor !="undefined")
	{
		index=this.actors.length;
		this.actors.push(actor);
		this.actorsPos[key]=index;
	}
	
	return this.actors[this.actorsPos[key]];
};
diagram.prototype.getSignal = function (signal)
{
	signal.index=this.signals.length;
	this.signals.push(signal);
	
	return this.signals[this.signals.length-1];
}
diagram.prototype.setContainerDiv = function (div)
{
	this.container=document.getElementById(div);
};
diagram.prototype.parse = function(input)
{
	var c=0;
	var pattern=/^(")?(.*?)\1([<>-]{2,3})(")?(.*?)\4:(.*)$/;
	parts=input.split(/\r|\n/);
	var $this=this;
	parts.forEach( function (item)
	{
		offA=0;
		offB=0;
		matches=item.match(pattern);
		if(matches[1] =='"')
			offA=1;
		if(matches[3+offA] =='"')
			offB=offA+1;
		a=new diagram.actor(matches[1+offA],matches[1+offA]);
		b=new diagram.actor(matches[3+offB],matches[3+offB]);
		a=$this.getActor(matches[1+offA],a);
		b=$this.getActor(matches[3+offB],b);
		if($this.actorsPos[a.key]>$this.actorsPos[b.key])
		{
			signal=new diagram.signal(matches[2+offA],b,a,matches[4+offB]);
			signal.setProperty("backref",true);
		}
		else signal=new diagram.signal(matches[2+offA],a,b,matches[4+offB]);
		$this.getSignal(signal);
	});
};
diagram.prototype.addParser = function (rule,parseFunc)
{
	this.parseFunc[this.parserRules.length]=parseFunc;
	this.parserRules.push(rule);
}
diagram.prototype.addWrapper=function(key,wrapper)
{
	this.wrappers[key]=wrapper;
}
diagram.prototype.addClass=function (key,clss)
{
	this.dClass[key].push(clss);
}
diagram.prototype.draw = function ()
{
	this.shifted=false;
	//clear container of any child nodes
	while (this.container.firstChild) 
	{
		this.container.removeChild(this.container.lastChild);
	}
	//draw SVG
	var x=10;
	var y=5;
	var svg=document.createElementNS(this.ns,'svg');
	//
	svg.setAttributeNS(null,'height',(this.signals.length+2)*(this.signalHeight+this.signalBuffer)+48);
	//svg.setAttributeNS(null, 'overflow', 'visible');
	svg.setAttribute("xmlns","http://www.w3.org/2000/svg");
	svg.setAttribute("xmlns:xlink","http://www.w3.org/1999/xlink");
	svg.setAttribute("version","1.1");
	svg.setAttribute("class",this.classRoot);
	svg.appendChild(this.filter);
	$this=this;
	this.container.appendChild(svg);
	this.actors.forEach(function (actor)
	{ 
		xw=$this.drawActor(svg,x,y,actor);
		x=x+xw+$this.minXGap;
	});
	y=y+$this.minHeight+this.signalHeight;
	
	svg.appendChild(this.markers.right);
	svg.appendChild(this.markers.left);
	this.signals.forEach(function (signal){
		$this.drawSignal(svg,y,signal);
		y+=$this.signalHeight+$this.signalBuffer;
	});
	
	svg.setAttributeNS(null,'width',this.actors[this.actors.length-1].x_pos+this.actors[this.actors.length-1].width/2+32	);
};
diagram.prototype.createLine=function(x,y,x2,y2,line,opt)
{
	line.setAttribute('x1',x);
	line.setAttribute('x2',x2);
	line.setAttribute('y1',y);
	line.setAttribute('y2',y2);
	line.setAttribute('stroke', '#000');
	return line;
}
diagram.prototype.createBox=function(x,y,box)
{
	box.setAttributeNS(null,'x',x);
	box.setAttributeNS(null,'y',y);
	box.setAttributeNS(null, 'width', $this.minWidth);
	box.setAttributeNS(null, 'height',$this.minHeight);
	return box;
}
diagram.prototype.drawActor = function (svg,x,y,actor)
{
	createBox=function(x,y,box)
	{
		box.setAttributeNS(null,'x',x);
		box.setAttributeNS(null,'y',y);
		box.setAttributeNS(null, 'width', $this.minWidth);
		box.setAttributeNS(null, 'height',$this.minHeight);
		return box;
	}
	
	var clss=this.dClass.actor.join(" ");
	var yOffset=(this.signals.length+2)*(this.signalHeight+this.signalBuffer);
	var xOffset=10;
	var line=document.createElementNS(this.ns,'line');
	var rect = this.createBox(x,y,document.createElementNS(this.ns, 'rect'));
	var brect = this.createBox(x,y+yOffset,document.createElementNS(this.ns, 'rect'));
	var tg=document.createElementNS(this.ns,"g");
	var bg=document.createElementNS(this.ns,"g");
	tg.setAttribute("class","squncDgrm-actor "+clss);
	tg.setAttribute("style","filter:url(#dropshadow)");
	bg.setAttribute("class","squncDgrm-actor "+clss);
	bg.setAttribute("style","filter:url(#dropshadow)");
	txt= document.createElementNS(this.ns,"text");
	btxt= document.createElementNS(this.ns,"text");
	txt.setAttribute('fill', '#000');
	txt.setAttribute("text-anchor","middle");
	txt.textContent=actor.name;
	btxt.setAttribute('fill', '#000');
	btxt.setAttribute("text-anchor","middle");
	btxt.textContent=actor.name;
	tg.appendChild(txt);
	if(this.wrappers.actor)
		svg.appendChild(this.wrappers.actor(actor,tg));
	else svg.appendChild(tg);
	var bbox = txt.getBBox();
	var xwidth = bbox.width+16;	
	actor.x_pos=x+xwidth/2;
	line=this.createLine(x+xwidth/2,y+$this.minHeight,x+xwidth/2,y+yOffset,line)
	line.setAttribute('id',"actorLine_"+actor.key);
	line.setAttribute('class','squncDgrm-actor_line')
	actor.width=xwidth;	
	txt.setAttribute('x', x+xwidth/2);//50% rect width
	txt.setAttribute('y', y+18);//75% rect width
	rect.setAttributeNS(null, 'width', xwidth);
	brect.setAttributeNS(null, 'width', xwidth);

	tg.insertBefore(rect,tg.childNodes[tg.childNodes.length-1]);
	btxt.setAttribute('y', y+18+yOffset);
	btxt.setAttribute('x', x+xwidth/2);//50% rect width
	bg.appendChild(brect);
	bg.appendChild(btxt);
	if(this.wrappers.actor)
		svg.appendChild(this.wrappers.actor(actor,bg));
	else svg.appendChild(bg);

	svg.appendChild(line);
	tg.setAttribute('id',"actorTop_"+actor.key);
	bg.setAttribute('id',"actorBottom_"+actor.key);
	actor.svgT="actorTop_"+actor.key;
	actor.svgL="actorLine_"+actor.key;
	actor.svgB="actorBottom_"+actor.key;
	return xwidth;
};
diagram.prototype.drawSignal = function (svg,y,signal)
{

	line=document.createElementNS(this.ns,'line');
	line.setAttribute('x1',signal.actorA.x_pos);
	line.setAttribute('x2',signal.actorB.x_pos);
	line.setAttribute('y1',y);
	line.setAttribute('y2',y);
	line.setAttribute('stroke', '#000');
	line.setAttribute('class','squncDgrm-signal_line');
	line.setAttribute('id','signal-line-'+signal.index);
	g=document.createElementNS(this.ns,'g');
	g.setAttribute('class','squncDgrm-signal');
	g.setAttribute('id','signal-group-'+signal.index);
	txt=document.createElementNS(this.ns,'text');
	txt.setAttribute('fill', '#000');
	txt.setAttribute("text-anchor","middle");
	txt.setAttribute('x',(signal.actorA.x_pos+signal.actorB.x_pos)/2);
	txt.setAttribute('y',y+6);//why 6?
	txt.textContent=signal.message;
	txt.setAttribute('class','squncDgrm-signal_message');
	switch(signal.direction)
	{
		case "left": line.setAttribute("marker-start","url(#leftArrow)");
			break;
		case "right": line.setAttribute("marker-end","url(#rightArrow)");
			break;
		case "bi": 
			line.setAttribute("marker-start","url(#leftArrow)");
			line.setAttribute("marker-end","url(#rightArrow)");
			break;
	}
	svg.appendChild(line);
	g.appendChild(txt);
	if(this.wrappers.signal)
		svg.appendChild(this.wrappers.signal(signal,g));
	else svg.appendChild(g);
	//check txt width and adjust positions if necessary
	var bbox = txt.getBBox();
	var w=bbox.width+64;//buffer of 32px either side
	var delta=signal.actorB.x_pos-signal.actorA.x_pos;
	if(w>delta )
	{
		delta=w-delta;

		this.shiftActors(signal.actorB,delta);
		line.setAttribute('x2',signal.actorB.x_pos);
		txt.setAttribute('x',(signal.actorA.x_pos+signal.actorB.x_pos)/2);
		if(typeof signal.backref !="undefined")
			this.shiftSignals(signal,signal.actorB)
	}
	var box=this.createBox(signal.actorA.x_pos+24+(signal.actorB.x_pos-signal.actorA.x_pos-w)/2,y-this.minHeight/2,document.createElementNS(this.ns,'rect'));
	box.setAttribute('width',w-48);
	box.setAttribute('fill','#fff');
	box.setAttribute('class','squncDgrm-signal_rect');
	g.insertBefore(box,g.childNodes[g.childNodes.length-1]);
}
diagram.prototype.shiftSignals=function(signal,actor)
{
	$this=this;
	for(i=signal.index;i>0 && (this.signals[i].actorA.key==actor.key || this.signals[i].actorB.key==actor.key);i--)
	{
		var dsig=document.getElementById('signal-line-'+i);
		var delta=Math.abs(parseFloat(dsig.getAttribute("x1"))-$this.signals[i].actorA.x_pos);
		dsig.setAttribute("x1",$this.signals[i].actorA.x_pos);
		dsig.setAttribute("x2",$this.signals[i].actorB.x_pos);
		var dg=document.getElementById('signal-group-'+i);
		dg.childNodes.forEach(function (ele){ele.setAttribute("x",parseFloat(ele.getAttribute("x"))+delta);});
	}
}
diagram.prototype.shiftActors=function(actor,delta)
{
	this.shifted=true;
	var i=this.actorsPos[actor.key];
	for(i=this.actorsPos[actor.key];i<this.actors.length;i++)
	{
		this.actors[i].x_pos+=delta;
		var tg=document.getElementById(this.actors[i].svgT);
		var line=document.getElementById(this.actors[i].svgL);
		var bg=document.getElementById(this.actors[i].svgB);
		tg.childNodes.forEach(function (item){item.setAttribute('x',parseFloat(item.getAttribute('x'))+delta)});
		line.setAttribute('x1',parseFloat(line.getAttribute('x1'))+delta);
		line.setAttribute('x2',parseFloat(line.getAttribute('x2'))+delta);
		bg.childNodes.forEach(function (item){item.setAttribute('x',parseFloat(item.getAttribute('x'))+delta);});
	}
};
