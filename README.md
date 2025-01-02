# Minidsp Remote

This is a remote control for the MiniDSP.  It is designed to be run on a Raspberry Pi.

<img src="screenshot.png" width="200">

## Client 

Client is programmed using ReactJS.

## Server

### MiniDSP version

Version 1.0 and up only supports `minidsp-rs` 1.10 and up. This version allows sources to be selected through the UI.

Versions lower than 1.0 support `minidsp-rs` 1.9.  Only volume control is supported for the MiniDSP.  

### How the server works

Server is a simple NodeJS server.  It makes call directly to the underlying binaries required for MiniDSP and uhubctl.  See https://minidsp-rs.pages.dev/cli/ and https://www.byfarthersteps.com/6802/.  

## Installing/running

Download the packaged static UI and server code `minidsp-ui.tar.gz` from `releases`.  Extract the tar.gz, and run `npm ci` to install the dependencies.  Run the server with `USB_INDEX=[yourusbindex] sudo node index` or `USB_INDEX=[yourusbindex] sudo npm start`.  The server has to run as root for `uhubctl` to access the USB ports.  It is recommended to run the server as a service.  See [examples/install_script.sh](./examples/install_script.sh) for an example of how to install server.  See [examples/minidsp-ui.service](./examples/minidsp-ui.service) for an example of how to run the server as a service.