# Minidsp Remote

## Client 

Client is programmed using ReactJS.

## Server

### MiniDSP version

Version 1.0 and up only supports `minidsp-rs` 1.10 and up. This version allows sources to be selected through the UI.

Version 1.0 supports `minidsp-rs` 1.9.  Only volume control is supported for the MiniDSP.  

### How the server works

Server is a simple NodeJS server.  It makes call directly to the underlying binaries required for MiniDSP and uhubctl.  See https://minidsp-rs.pages.dev/cli/ and https://www.byfarthersteps.com/6802/.  

## Installing/running

Download the packaged static UI from the `releases` section.  The server itself expects to host these at `./build`.  Run the server with `USB_INDEX=[yourusbindex] sudo node index` or `USB_INDEX=[yourusbindex] sudo npm start`.  The server has to run as root for `uhubctl` to access the USB ports.  