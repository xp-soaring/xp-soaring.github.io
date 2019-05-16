/*
 * 1.0 code.
 */

import java.applet.Applet;
import java.awt.*;

public class Panel extends Applet
{

  float speed = (float) 0.0;     // speed (in knots) for display on ASI
  float climb = (float) 0.0;     // rate of climb (in knots) for display on vario
  float altitude = (float) 0.0;  // altitude (in feet) for display on altimeter
  int   time = 0;                // log time of update, for instrument smoothing

  // previous values for XOR writes
  float prev_speed = (float) 40.0;     // speed (in knots) for display on ASI
  float prev_climb = (float) 0.0;     // rate of climb (in knots) for display on vario
  float prev_altitude = (float) 0.0;  // altitude (in feet) for display on altimeter
  int   prev_time = 0;                // log time of update, for instrument smoothing

  //****************************
  // java interface for prototype
  
  public void set_speed(float v)
    {
      speed = v;
    }

  public void set_climb(float v)
    {
      climb = v;
    }

  public void set_altitude(float v)
    {
      altitude = v;
    }

  public void set_time(int t)
    {
      time = t;
    }

  public void update()
    {
      refresh();
    }
    
  public void plus_one() // test routine
    {
      speed = speed + 5;
      climb = climb + 1;
      altitude = altitude + 100;
      refresh();
    }

  public void minus_one() // test routine
    {
      speed = speed - 10;
      climb = climb - 1;
      altitude = altitude - 200;
      refresh();
    }
 
  // end of java interface for prototype
  //****************************


  static int NEEDLE_POINTS = 8;

  int [] needle_s_x = new int[NEEDLE_POINTS]; // x,y coordinates for small needle
  int [] needle_s_y = new int[NEEDLE_POINTS];

  int [] needle_l_x = new int[NEEDLE_POINTS]; // x,y coordinates for large needle
  int [] needle_l_y = new int[NEEDLE_POINTS];

  // calibration matrix for asi, 0..200kts in 10kt increments
  double speed_angle[] = new double[]{-30,-15.36,-0.73,13.90,28.54,48,67.5,91.11,117.14,140,167.5,
                                    188.33,205.45,223.33,240,256.67,272.31,289.09,306.67,340};

  Image panel_img;

  public void init()
   {
        panel_init();
   }

  void panel_init()
    {
      needle_s_x[0]=0;  needle_s_y[0]=6;
      needle_s_x[1]=6;  needle_s_y[1]=0;
      needle_s_x[2]=3;  needle_s_y[2]=-3;
      needle_s_x[3]=3;  needle_s_y[3]=-20;
      needle_s_x[4]=0;  needle_s_y[4]=-30;
      needle_s_x[5]=-3; needle_s_y[5]=-20;
      needle_s_x[6]=-3; needle_s_y[6]=-3;
      needle_s_x[7]=-6; needle_s_y[7]=0;

      needle_l_x[0]=0;  needle_l_y[0]=6;
      needle_l_x[1]=6;  needle_l_y[1]=0;
      needle_l_x[2]=3;  needle_l_y[2]=-3;
      needle_l_x[3]=3;  needle_l_y[3]=-45;
      needle_l_x[4]=0;  needle_l_y[4]=-55;
      needle_l_x[5]=-3; needle_l_y[5]=-45;
      needle_l_x[6]=-3; needle_l_y[6]=-3;
      needle_l_x[7]=-6; needle_l_y[7]=0;

      panel_img = getImage(getCodeBase(), "images/panel.jpg");
    }

  // update panel with values from class variables
  void refresh()
    {
      Graphics g = getGraphics();
      update_speed(g);
      update_climb(g);
      update_altitude(g);
    }

  void update_speed(Graphics g)
    {
      draw_speed(g,prev_speed); // erase old needle
      draw_speed(g,speed); // draw new needle
      prev_speed = speed;
    }

  void update_climb(Graphics g)
    {
      g.setXORMode(Color.white);
      draw_climb(g, prev_climb); // erase old needle
      draw_climb(g, climb); // draw new needle
      prev_climb = climb;
    }

  void update_altitude(Graphics g)
    {
      g.setXORMode(Color.white);
      draw_altitude(g, prev_altitude); // erase old needle
      draw_altitude(g, altitude); // draw new needle
      prev_altitude = altitude;
    }

  void draw_speed(Graphics g, float speed)
    {
      // linear interpolation using speed_angle[] array
      int i = (int) (speed / 10);
      if (i>=19) i = 18;
      float base_speed = i*10;
      float angle = (float) ((speed - base_speed)/10 * ( speed_angle[i+1] - speed_angle[i])+ speed_angle[i]);
      g.setXORMode(Color.white);
      draw_needle(g, 75, 75, angle, needle_l_x, needle_l_y);
    }

  void draw_climb(Graphics g, float climb)
    {
      g.setXORMode(Color.white);
      draw_needle(g, 225, 75, climb*18-90, needle_l_x, needle_l_y);
    }

  void draw_altitude(Graphics g, float altitude)
    {
      g.setXORMode(Color.white);
      draw_needle(g, 375, 75, altitude / 1000 * 36, needle_s_x, needle_s_y);
      draw_needle(g, 375, 75, (altitude % 1000) / 1000 * 360, needle_l_x, needle_l_y);
    }

  // draw large needle centered x,y at angle theta (0 = point upwards)

  void draw_needle(Graphics g, int x, int y, float theta,int [] needle_x, int [] needle_y)
    {
      int [] new_x = new int[NEEDLE_POINTS];
      int [] new_y = new int[NEEDLE_POINTS];

      double theta_r = theta / 180 * Math.PI ; // theta in radians

      for (int i=0; i<NEEDLE_POINTS; i++)
        {
          new_x[i] = (int) ((double) x + (double) needle_x[i] * Math.cos(theta_r) - (double) needle_y[i] * Math.sin(theta_r));
          new_y[i] = (int) ((double) y + (double) needle_x[i] * Math.sin(theta_r) + (double) needle_y[i] * Math.cos(theta_r));
        }
      g.fillPolygon(new_x, new_y, NEEDLE_POINTS); 
    }


  public void paint(Graphics g)
    {
        g.drawImage(panel_img, 0, 0, this); 

        // draw needles
        draw_speed(g, prev_speed);
        draw_climb(g, prev_climb);
        draw_altitude(g, prev_altitude);
        
    }
}

