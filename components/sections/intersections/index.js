var React = require("react");
var Graphic = require("../../Graphic.jsx");
var SectionHeader = require("../../SectionHeader.jsx");

var min = Math.min, max = Math.max;

var Intersections = React.createClass({
  getDefaultProps: function() {
    return {
      title: "Intersections"
    };
  },

  setupLines: function(api) {
    var curve1 = new api.Bezier([50,50,150,110]);
    var curve2 = new api.Bezier([50,250,170,170]);
    api.setCurve(curve1, curve2);
  },

  drawLineIntersection: function(api, curves) {
    api.reset();

    var lli = api.utils.lli4;
    var p = lli(
      curves[0].points[0],
      curves[0].points[1],
      curves[1].points[0],
      curves[1].points[1]
    );

    var mark = 0;
    curves.forEach(curve => {
      api.drawSkeleton(curve);
      api.setColor("black");
      if (p) {
        var pts = curve.points,
            mx = min(pts[0].x, pts[1].x),
            my = min(pts[0].y, pts[1].y),
            Mx = max(pts[0].x, pts[1].x),
            My = max(pts[0].y, pts[1].y);
        if (mx <= p.x && my <= p.y && Mx >= p.x && My >= p.y) {
          api.setColor("#00FF00");
          mark++;
        }
      }
      api.drawCurve(curve);
    });

    if (p) {
      api.setColor(mark < 2 ? "red" : "#00FF00");
      api.drawCircle(p, 3);
    }
  },

  setupQuadratic: function(api) {
    var curve1 = api.getDefaultQuadratic();
    var curve2 = new api.Bezier([15,250,220,20]);
    api.setCurve(curve1, curve2);
  },

  setupCubic: function(api) {
    var curve1 = new api.Bezier([100,240, 30,60, 210,230, 160,30]);
    var curve2 = new api.Bezier([25,260, 230,20]);
    api.setCurve(curve1, curve2);
  },

  draw: function(api, curves) {
    api.reset();
    curves.forEach(curve => {
      api.drawSkeleton(curve);
      api.drawCurve(curve);
    });

    var utils = api.utils;
    var line = { p1: curves[1].points[0], p2: curves[1].points[1] };
    var acpts = utils.align(curves[0].points, line);
    var nB = new api.Bezier(acpts);
    var roots = utils.roots(nB.points);
    roots.forEach(t => {
      var p = curves[0].get(t);
      api.drawCircle(p, 3);
      api.text("t = " + t, {x: p.x + 5, y: p.y + 10});
    });
  },

  render: function() {
    return (
      <section>
        <SectionHeader {...this.props} />

         <p>Let's look at some more things we will want to do with Bézier curves. Almost immediately after figuring out how to
        get bounding boxes to work, people tend to run into the problem that even though the minimal bounding box (based on
        rotation) is tight, it's not sufficient to perform true collision detection. It's a good first step to make sure
        there <em>might</em> be a collision (if there is no bounding box overlap, there can't be one), but in order to do
        real collision detection we need to know whether or not there's an intersection on the actual curve.</p>

        <p>We'll do this in steps, because it's a bit of a journey to get to curve/curve intersection checking. First, let's
        start simple, by implementing a line-line intersection checker. While we can solve this the traditional calculus way
        (determine the functions for both lines, then compute the intersection by equating them and solving for two unknowns),
        linear algebra actually offers a nicer solution.</p>

        <h3>Line-line intersections</h3>

        <p id="intersection_ll">if we have two line segments with two coordinates each, segments A-B and C-D, we can find the
        intersection of the lines these segments are an intervals on by linear algebra, using the procedure outlined in
        this <a href="http://www.topcoder.com/tc?module=Static&d1=tutorials&d2=geometry2#line_line_intersection">top coder</a> article.
        Of course, we need to make sure that the intersection isn't just on the lines our line segments lie on, but also on our
        line segments themselves, so after we find the intersection we need to verify it lies without the bounds of our original
        line segments.</p>

        <p>The following graphic implements this intersection detection, showing a red point for an intersection on the lines
        our segments lie on (thus being a virtual intersection point), and a green point for an intersection that lies on
        both segments (being a real intersection point).</p>

        <Graphic preset="simple" title="Line/line intersections" setup={this.setupLines} draw={this.drawLineIntersection} />

        <div className="howtocode">
          <h3>Implementing line-line intersections</h3>

          <p>Let's have a look at how to implement a line-line intersection checking function. The basics are covered in the
          article mentioned above, but sometimes you need more function signatures, because you might not want to call your
          function with eight distinct parameters. Maybe you're using point structs or the line. Let's get coding:</p>

          <pre>lli8 = function(x1,y1,x2,y2,x3,y3,x4,y4):
  var nx=(x1*y2-y1*x2)*(x3-x4)-(x1-x2)*(x3*y4-y3*x4),
      ny=(x1*y2-y1*x2)*(y3-y4)-(y1-y2)*(x3*y4-y3*x4),
      d=(x1-x2)*(y3-y4)-(y1-y2)*(x3-x4);
  if d=0:
    return false
  return point(nx/d, ny/d)

lli4 = function(p1, p2, p3, p4):
  var x1 = p1.x, y1 = p1.y,
      x2 = p2.x, y2 = p2.y,
      x3 = p3.x, y3 = p3.y,
      x4 = p4.x, y4 = p4.y;
  return lli8(x1,y1,x2,y2,x3,y3,x4,y4)

lli = function(line1, line2):
  return lli4(line1.p1, line1.p2, line2.p1, line2.p2)</pre>
        </div>

        <h3>What about curve-line intersections?</h3>

        <p>Curve/line intersection is more work, but we've already seen the techniques we need to use in order
        to perform it: first we translate/rotate both the line and curve together, in such a way that the line
        coincides with the x-axis. This will position the curve in a way that makes it cross the line at
        points where its y-function is zero. By doing this, the problem of finding intersections between a
        curve and a line has now become the problem of performing root finding on our translated/rotated curve,
        as we already covered in the section on finding extremities.
        </p>

        <Graphic preset="simple" title="Quadratic curve/line intersections" setup={this.setupQuadratic} draw={this.draw}/>
        <Graphic preset="simple" title="Cubic curve/line intersections" setup={this.setupCubic} draw={this.draw}/>

        <p>Curve/curve intersection, however, is more complicated. Since we have no straight line to align to, we
        can't simply align one of the curves and be left with a simple procedure. Instead, we'll need to apply two
        techniques we've not covered yet: de Casteljau's algorithm, and curve splitting.</p>

      </section>
    );
  }
});

module.exports = Intersections;
