/* "Low level" canvas drawing routines */

var Draw = Draw || {};

Draw.putpixel = function (pix, width, x, y, color) {
    var start = (y*width+x)*4;
    pix[start] = color[0];
    pix[start+1] = color[1];
    pix[start+2] = color[2];
    pix[start+3] = color[3];
};


Draw.eraseimage = function (image, context, x, y, width, height) {
    var from_pix = image.getContext("2d").getImageData(0, 0, width, height);
    var to_pix = context.getImageData(x, y, width, height);
    var from_data = from_pix.data, to_data = to_pix.data;
    for (var i=0, ilen=from_data.length; i < ilen; i+=4) {
        if (from_data[i+3] > 0) {
            // to_data[i] = 0;
            // to_data[i+1] = 0;
            // to_data[i+2] = 0;
            to_data[i+3] = 0;
        }
    }
    context.clearRect(x, y, width, height);
    context.putImageData(to_pix, x, y);
};


Draw.drawimage = function (image, context, x, y, erase) {
    if (erase) {
        Draw.eraseimage(image, context, x, y, image.width, image.height);
    } else {
        context.drawImage(image, x, y, image.width, image.height);
    }
}

// Bresenham line drawing
Draw.drawline = function (pix, width, startPt, endPt, color) {
    var x1 = startPt.x, y1 = startPt.y, x2 = endPt.x, y2 = endPt.y,
        dx = x2 - x1, sx = 1, dy = y2 - y1, sy = 1,
        fraction,
        rect = {left:Math.min(x1, x2), top:Math.min(y1, y2),
                width:Math.abs(x2-x1)+1, height:Math.abs(y2-y1)+1};

    if (dx < 0) {
        sx = -1;
        dx = -dx;
    }
    if (dy < 0) {
        sy = -1;
        dy = -dy;
    }

    dx = dx << 1;
    dy = dy << 1;
    this.colorPixel(pix, (y1*width+x1)*4, color);

    if (dy < dx) {
        fraction = dy - (dx>>1);
        while (x1 != x2) {
            if (fraction >= 0) {
                y1 += sy;
                fraction -= dx;
            }
            fraction += dy;
            x1 += sx;
            this.colorPixel(pix, (y1*width+x1)*4, color);
        }
    } else {
        fraction = dx - (dy>>1);
        while (y1 != y2) {
            if (fraction >= 0) {
                x1 += sx;
                fraction -= dy;
            }
            fraction += dx;
            y1 += sy;
            this.colorPixel(pix, (y1*width+x1)*4, color);
        }
    }
    return rect;
};

Draw.drawLineWithBrush = function (context, startPt, endPt, brush, step, erase) {
    var x1 = startPt.x;
    var y1 = startPt.y;
    var x2 = endPt.x;
    var y2 = endPt.y;
    var dx = x2 - x1;
    var sx = 1;
    var dy = y2 - y1;
    var sy = 1;
    var hw = Math.floor(brush.width/2);
    var hh = Math.floor(brush.height/2);
    var fraction;

    if (dx < 0)    {
        sx = -1;
        dx = -dx;
    }
    if (dy < 0)    {
        sy = -1;
        dy = -dy;
    }

    var rect = {left:Math.min(x1, x2)-hw,
                top:Math.min(y1, y2)-hh,
                width:dx+brush.width,
                height:dy+brush.height};

    dx = dx << 1;
    dy = dy << 1;
    //context.drawImage(brush, x1-hw, y1-hh, brush.width, brush.height);
    Draw.drawimage(brush, context, x1-hw, y1-hh, erase);
    if (dy < dx) {
        fraction = dy - (dx>>1);
        while (x1 != x2) {
            if (fraction >= 0) {
                y1 += sy;
                fraction -= dx;
            }
            fraction += dy;
            x1 += sx;
            //context.drawImage(brush, x1-hw, y1-hh);
            Draw.drawimage(brush, context, x1-hw, y1-hh, erase);
        }
    } else {
        fraction = dx - (dy>>1);
        while (y1 != y2)
        {
            if (fraction >= 0)
            {
                x1 += sx;
                fraction -= dy;
            }
            fraction += dx;
            y1 += sy;
            //context.drawImage(brush, x1-hw, y1-hh);
            Draw.drawimage(brush, context, x1-hw, y1-hh, erase);
        }
    }
    return rect;
};

Draw.drawEllipseWithBrush = function (context, x0, y0, a, b, brush, step, n, erase) {
    if (a === 0 || b === 0) {
        return;
    } else {
	a = Math.abs(a);
	b = Math.abs(b);
	var a2  = 2 * a * a;
	var b2  = 2 * b * b;
	var error = a * a * b;
	var x = 0;
	var y = b;
	var stopy = 0;
	var stopx = a2 * b ;
        var hw = Math.floor(brush.width / 2);
        var hh = Math.floor(brush.height / 2);
	while (stopy <= stopx) {
	    //context.drawImage(brush, x0 + x - hw, y0 + y - hh);
            Draw.drawimage(brush, context, x0+x-hw, y0+y-hh, erase);
	    //context.drawImage(brush, x0 - x - hw, y0 + y - hh);
            Draw.drawimage(brush, context, x0-x-hw, y0+y-hh, erase);
	    //context.drawImage(brush, x0 - x - hw, y0 - y - hh);
            Draw.drawimage(brush, context, x0-x-hw, y0-y-hh, erase);
	    //context.drawImage(brush, x0 + x - hw, y0 - y - hh);
            Draw.drawimage(brush, context, x0+x-hw, y0-y-hh, erase);
	    ++x;
	    error -= b2 * (x - 1);
	    stopy += b2;
	    if (error <= 0) {
		error += a2 * (y - 1);
		--y;
		stopx -= a2;
	    }
	}
        var xo = x;
	error = b * b * a;
	x = a;
	y = 0;
	stopy = b2 * a;
	stopx = 0;
	while (stopy >= stopx) {
	    //context.drawImage(brush, x0 + x - hw, y0 + y - hh);
            Draw.drawimage(brush, context, x0+x-hw, y0+y-hh, erase);
	    //context.drawImage(brush, x0 - x - hw, y0 + y - hh);
            Draw.drawimage(brush, context, x0-x-hw, y0+y-hh, erase);
	    //context.drawImage(brush, x0 - x - hw, y0 - y - hh);
            Draw.drawimage(brush, context, x0-x-hw, y0-y-hh, erase);
	    //context.drawImage(brush, x0 + x - hw, y0 - y - hh);
            Draw.drawimage(brush, context, x0+x-hw, y0-y-hh, erase);

	    // context.drawImage(brush, x0 + x - hw, y0 + y - hh);
	    // context.drawImage(brush, x0 - x - hw, y0 + y - hh);
	    // context.drawImage(brush, x0 - x - hw, y0 - y - hh);
	    // context.drawImage(brush, x0 + x - hw, y0 - y - hh);
	    ++y;
	    error -= a2 * (y - 1);
	    stopx += a2;
	    if (error < 0) {
		error += b2 * (x - 1);
		--x;
		stopy -= b2;
	    }
	}
    }
    return {left:x0-a-hw, top:y0-b-hh, width:2*a+2*hw+1, height:2*b+2*hh+1};
};

Draw.drawFilledEllipse = function (context, x0, y0, a, b, color) {
    if (a === 0 || b === 0) {
        return;
    } else {
	a = Math.abs(a);
	b = Math.abs(b);
	var a2  = 2*a * a;
	var b2  = 2*b * b;
	var error  = a*a*b;
	var x  = 0;
	var y  = b;
	var stopy  = 0;
	var stopx  = a2 * b;
        if (color[3] == 0) {
            var draw_rect = function (x, y, w, h) {context.clearRect(x, y, w, h);};
        } else {
            var draw_rect = function (x, y, w, h) {context.fillRect(x, y, w, h);};
        }
        if (color instanceof Array) {
            context.fillStyle =
                "rgb("+color[0]+","+color[1]+","+color[2]+")";
        } else {
            context.fillStyle = "rgb("+color+",0,0)";
        }
	while (stopy <= stopx) {
            draw_rect(x0+x, y0, 1, y+1);
            draw_rect(x0-x, y0, 1, y+1);
            draw_rect(x0-x, y0, 1, -y);
            draw_rect(x0+x, y0, 1, -y);
	    ++x;
	    error -= b2 * (x - 1);
	    stopy += b2;
	    if (error <= 0) {
		error += a2 * (y - 1);
		--y;
		stopx -= a2;
	    }
	}

        var xo = x;

	error = b*b*a;
	x = a;
	y = 0;
	stopy = b2*a;
	stopx = 0;
	while (stopy >= stopx) {
            draw_rect(x0+xo, y0+y, (x-xo)+1, 1);
            draw_rect(x0-xo+1, y0+y, -(x-xo)-1, 1);
            draw_rect(x0-xo+1, y0-y, -(x-xo)-1, 1);
            draw_rect(x0+xo, y0-y, x-xo+1, 1);
	    ++y;
	    error -= a2 * (y - 1);
	    stopx += a2;
	    if (error < 0) {
		error += b2 * (x - 1);
		--x;
		stopy -= b2;
	    }
	}
    }
    return {left:x0-a, top:y0-b, width:2*a+1, height:2*b+1};
};

Draw.get_pos = function (pixel, width) {
    return {x: pixel % width, y: Math.floor(pixel / width)};
};

Draw.bucketfill = function (colorLayer, canvasWidth, canvasHeight, pt, color) {
    console.log("Bucketfill start");
    var startX = pt.x;
    var startY = pt.y;
    var pixelStack = [[startX, startY]];
    var startColor = [colorLayer[(startY*canvasWidth+startX)*4],
                      colorLayer[(startY*canvasWidth+startX)*4+1],
                      colorLayer[(startY*canvasWidth+startX)*4+2]];
    var newPos, x, y, pixelPos, reachLeft, reachRight;

    var match_color = function (colorLayer, pixelPos, startcolor) {
        var r = colorLayer[pixelPos];
        var g = colorLayer[pixelPos+1];
        var b = colorLayer[pixelPos+2];

        return (r == startcolor[0] && g == startcolor[1] && b == startcolor[2]);
    };

    if (match_color(colorLayer, (pt.y*canvasWidth + pt.x) * 4, color)) {
        console.log("Nothing to fill");
        return {left: 0, top: 0, width: 0, height: 0};
    }

    var to_fill = [];
    var xmin = canvasWidth, xmax = 0, ymin = canvasHeight, ymax = 0, pos;
    while(pixelStack.length > 0) {
        newPos = pixelStack.pop();
        x = newPos[0];
        y = newPos[1];

        pixelPos = (y*canvasWidth + x) * 4;
        while(y-- >= 0 && match_color(colorLayer, pixelPos, startColor)) {
            pixelPos -= canvasWidth * 4;
        }
        pixelPos += canvasWidth * 4;
        ++y;
        reachLeft = false;
        reachRight = false;
        while(y++ < canvasHeight-1 &&
              match_color(colorLayer, pixelPos, startColor)) {
            Draw.colorPixel(colorLayer, pixelPos, color);
            to_fill.push([x, y]);
            xmin = Math.min(xmin, x);
            xmax = Math.max(xmax, x);
            ymin = Math.min(ymin, y);
            ymax = Math.max(ymax, y);
            if(x > 0) {
                if(match_color(colorLayer, pixelPos - 4, startColor)) {
                    if(!reachLeft) {
                        pixelStack.push([x - 1, y]);
                        reachLeft = true;
                    }
                }
                else if(reachLeft) {
                    reachLeft = false;
                }
            }

            if(x < canvasWidth-1) {
                if(match_color(colorLayer, pixelPos + 4, startColor)) {
                    if(!reachRight) {
                        pixelStack.push([x + 1, y]);
                        reachRight = true;
                    }
                }
                else if(reachRight) {
                    reachRight = false;
                }
            }
            pixelPos += canvasWidth * 4;
        }
    }
    return {left: xmin, top: ymin, width: xmax-xmin+1, height: ymax-ymin+1,
            pixels: to_fill};
};

Draw.gradientfill = function (img, width, height, pt, colors) {
    console.log("gradfill:", img, width, height, pt, colors);
    var fill = Draw.bucketfill(img, width, height, pt, colors[0]);
    var pos, index;
    var linear_gradient = function (pos, ncols) {
        return Math.floor((pos[0] - fill.left) / (fill.width/ncols));
    };
    for (var i=0, ilen=fill.pixels.length; i < ilen; i++) {
        pos = fill.pixels[i];
        index = linear_gradient(pos, colors.length);
        Draw.colorPixel(img, 4*(pos[0] + width*pos[1]), colors[index]);
    }
    return fill;
};


Draw.colorPixel = function (colorLayer, pixelPos, color) {
    colorLayer[pixelPos] = color[0];
    colorLayer[pixelPos+1] = color[1];
    colorLayer[pixelPos+2] = color[2];
    colorLayer[pixelPos+3] = color[3];
};