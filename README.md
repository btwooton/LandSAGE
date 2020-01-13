# LandSAGE
Code for the LandSAGE Visualization Prototype Application for SAGE2

# Description
The LandSAGE application is a SAGE2 native application written exclusively for SAGE2 powered CyberCANOE systems.
The code in this repository is split into two subdirectories, each of which is a self-contained SAGE2 application.
The LandSAGE directory contains the actual LandSAGE application prototype. This application depends upon the other
application (TMDMonthlyRainfall) in order to run correctly.
When a user clicks the "View Monthly Rainfall" button on the leaflet popup for one of the TMD weather sensors (blue points)
an instance of the TMDMonthlyRainfall application opens on the SAGE wall, showing the monthly rainfall for the selected location in a Plotly line chart. 

__Both applications can be loaded into SAGE in with one of the following two methods.__

## Method 1: Dragging Zipped Applications to the SAGE2 Enabled CyberCANOE
1. Drag the zipped contents of each of the application directories to the SAGE wall via the WebUI, just as you would a PDF or image.
2. Open the LandSAGE application via the SAGE2 App Launcher button in the WebUI
3. The TMDMonthlyRainfall application will be triggered each time a user pushes the "View Monthly Rainfall" button in one of the Leaflet popups

## Method 2: Add Application Directories to Documents/SAGE2_Media/apps/
1. Add both of the application folders (LandSAGE and TMDMonthlyRainfall) to the SAGE2_Media/apps directory, which is typically found in the Documents directory
2. Open the LandSAGE application via the SAGE2 App Launcher button in the WebUI
3. The TMDMonthlyRainfall application will be triggered each time a user pushes the "View Monthly Rainfall" button in one of the Leaflet popups

# Issue Reporting
Send bug requests/issues to the developers at bwooton@hawaii.edu or feel free to post any issues on this repository.
