(function(){
  "use strict";
  var OPS = pdfjsLib.OPS;
  function mul(m1,m2){return [m1[0]*m2[0]+m1[2]*m2[1],m1[1]*m2[0]+m1[3]*m2[1],m1[0]*m2[2]+m1[2]*m2[3],m1[1]*m2[2]+m1[3]*m2[3],m1[0]*m2[4]+m1[2]*m2[5]+m1[4],m1[1]*m2[4]+m1[3]*m2[5]+m1[5]];}
  function median(a){if(!a.length)return 0;a=a.slice().sort(function(x,y){return x-y;});var m=Math.floor(a.length/2);return a.length%2?a[m]:(a[m-1]+a[m])/2;}
  function wmedian(pairs){if(!pairs.length)return 0;pairs=pairs.slice().sort(function(x,y){return x.v-y.v;});var t=pairs.reduce(function(s,x){return s+x.w;},0),a=0;for(var i=0;i<pairs.length;i++){a+=pairs[i].w;if(a>=t/2)return pairs[i].v;}return pairs[pairs.length-1].v;}
  function pct(v){return Math.max(0,Math.min(100,v));}

  async function analyzePage(page){
    var vp=page.getViewport({scale:1}), W=vp.width, H=vp.height, area=W*H;
    var tc=await page.getTextContent();
    var items=[];
    (tc.items||[]).forEach(function(it){
      if(!it.str||!it.str.trim())return;
      var tr=it.transform||[1,0,0,1,0,0];
      var size=Math.hypot(tr[2],tr[3])||Math.abs(tr[3])||10;
      var w=(typeof it.width==="number"&&it.width>0)?it.width:it.str.length*size*0.5;
      items.push({str:it.str,x:tr[4],y:H-tr[5],size:size,w:w});
    });
    var bodySize=wmedian(items.map(function(it){return {v:it.size,w:Math.max(1,it.str.length)};}))||9;
    var maxSize=items.length?Math.max.apply(null,items.map(function(i){return i.size;})):bodySize;

    // group rows by y
    items.sort(function(a,b){return a.y-b.y||a.x-b.x;});
    var rows=[];
    items.forEach(function(it){
      var row=null;
      for(var i=rows.length-1;i>=0;i--){ if(Math.abs(rows[i].y-it.y)<=Math.max(2.2,it.size*0.35)){row=rows[i];break;} }
      if(!row){row={y:it.y,items:[]};rows.push(row);}
      row.items.push(it);
    });
    // split rows into segments by gutters
    var lines=[];
    rows.forEach(function(row){
      row.items.sort(function(a,b){return a.x-b.x;});
      var seg=null;
      row.items.forEach(function(it){
        var gap=seg?it.x-seg.xMax:999;
        if(!seg||gap>Math.max(7,bodySize*0.95)||it.x<seg.xMax-2){
          seg={y:row.y,xMin:it.x,xMax:it.x+it.w,size:0,chars:0,str:""};lines.push(seg);
        }
        seg.xMax=Math.max(seg.xMax,it.x+it.w);
        seg.size=Math.max(seg.size,it.size);
        seg.chars+=it.str.length;
        seg.str+=(seg.str?" ":"")+it.str;
      });
    });
    var threshold=bodySize*1.85;
    var bodyItems=items.filter(function(it){return it.size<=threshold;});
    var bodyLines=lines.filter(function(l){return l.size<=threshold&&(l.xMax-l.xMin)>W*0.04;});
    var allChars=items.reduce(function(s,it){return s+it.str.length;},0);

    // text bbox + coverage
    var bx0=W,by0=H,bx1=0,by1=0,cov=0;
    bodyLines.forEach(function(l){
      bx0=Math.min(bx0,l.xMin);bx1=Math.max(bx1,l.xMax);
      by0=Math.min(by0,l.y);by1=Math.max(by1,l.y);
      cov+=(l.xMax-l.xMin)*l.size*1.25;
    });

    // columns: count how many line segments cover each x-bin; gutters stay low
    var bins=300, occ=new Array(bins).fill(0);
    bodyLines.forEach(function(l){
      var a=Math.max(0,Math.floor(l.xMin/W*bins));
      var b=Math.min(bins-1,Math.ceil(l.xMax/W*bins));
      for(var i=a;i<=b;i++)occ[i]++;
    });
    var maxOcc=Math.max.apply(null,occ);
    var cut=Math.max(1,Math.round(maxOcc*0.22));
    var first=-1,last=-1;
    for(var f=0;f<bins;f++){if(occ[f]>=cut){first=f;break;}}
    for(var g=bins-1;g>=0;g--){if(occ[g]>=cut){last=g;break;}}
    var minGap=Math.max(2,Math.round(8/W*bins));
    var gaps=[],run=0;
    if(first>=0){for(var j=first;j<=last;j++){if(occ[j]<cut){run++;}else{if(run>=minGap)gaps.push(run);run=0;}}}
    // clusters of segment starts
    var starts=bodyLines.map(function(l){return Math.round(l.xMin/5)*5;}).sort(function(a,b){return a-b;});
    var clusters=[];
    starts.forEach(function(x){var c=clusters.length?clusters[clusters.length-1]:null;if(c&&Math.abs(c.x-x)<=7)c.n++;else clusters.push({x:x,n:1});});
    var strong=clusters.filter(function(c){return c.n>=Math.max(2,bodyLines.length*0.06);});
    var columns=gaps.length+1;
    if(columns<1||columns>8){columns=strong.length||1;}
    var gutterPct=gaps.length?median(gaps.map(function(g){return g/W*100;})):0;

    // images
    var ops=await page.getOperatorList();
    var ctm=[1,0,0,1,0,0],stack=[],imgArea=0,imgCount=0,imgOps={};
    ["paintImageXObject","paintJpegXObject","paintInlineImageXObject","paintImageMaskXObject","paintImageXObjectRepeat","paintImageMaskXObjectRepeat","paintSolidColorImageMask"].forEach(function(k){if(OPS[k]!==undefined)imgOps[OPS[k]]=k;});
    for(var k=0;k<ops.fnArray.length;k++){
      var fn=ops.fnArray[k],args=ops.argsArray[k];
      if(fn===OPS.save){stack.push(ctm.slice());}
      else if(fn===OPS.restore){ctm=stack.pop()||[1,0,0,1,0,0];}
      else if(fn===OPS.transform){ctm=mul(ctm,args);}
      else if(imgOps[fn]){imgArea+=Math.abs(ctm[0]*ctm[3]-ctm[1]*ctm[2]);imgCount++;}
    }

    // font families
    var fams={};
    Object.keys(tc.styles||{}).forEach(function(k){var st=tc.styles[k];if(st&&st.fontFamily)fams[st.fontFamily]=1;});

    return {
      W:W,H:H,ratio:W/H,lines:bodyLines.length,chars:allChars,
      bodySize:bodySize,headlineSize:maxSize,headlineRatio:maxSize/Math.max(bodySize,1),
      columns:columns,gaps:gaps.length,gutterPct:gutterPct,
      textCoverage:Math.min(1,cov/area),imageCoverage:Math.min(1,imgArea/area),imageCount:imgCount,
      margins:{left:bx0/W*100,right:(1-bx1/W)*100,top:by0/H*100,bottom:(1-by1/H)*100},
      fonts:Object.keys(fams)
    };
  }

  async function analyzeFile(file){
    var data=new Uint8Array(await file.arrayBuffer());
    var pdf=await pdfjsLib.getDocument({data:data}).promise;
    var n=Math.min(pdf.numPages,5),pages=[];
    for(var i=1;i<=n;i++)pages.push(await analyzePage(await pdf.getPage(i)));
    function avg(k){return pages.reduce(function(s,p){return s+p[k];},0)/pages.length;}
    function med(k){return median(pages.map(function(p){return p[k];}));}
    var margins={};
    ["left","right","top","bottom"].forEach(function(k){margins[k]=pages.reduce(function(s,p){return s+p.margins[k];},0)/pages.length;});
    var result={
      pages:pdf.numPages,sampled:n,
      pageW:pages[0].W,pageH:pages[0].H,ratio:med("ratio"),
      columns:med("columns"),gaps:avg("gaps"),gutterPct:avg("gutterPct"),
      bodySize:med("bodySize"),headlineSize:Math.max.apply(null,pages.map(function(p){return p.headlineSize;})),
      headlineRatio:avg("headlineRatio"),
      textCoverage:avg("textCoverage"),imageCoverage:avg("imageCoverage"),imageCount:avg("imageCount"),
      charsPerPage:avg("chars"),linesPerPage:avg("lines"),
      textDensity:avg("chars")/(pages[0].W*pages[0].H)*10000,
      margins:margins,fonts:pages.reduce(function(a,p){return a.concat(p.fonts);},[]).filter(function(v,i,a){return a.indexOf(v)===i;})
    };
    result.perPage=pages;
    pdf.destroy();
    return result;
  }
  window.analyzeFile=analyzeFile;
})();