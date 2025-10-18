# Minidsp Remote

This is a remote control for the MiniDSP.  It is designed to be run on a Raspberry Pi.

<img src="screenshot.png" width="200">

## Client

Client is programmed using ReactJS.

Client runs tests using a headless browser.

`npx playwright install`

## Server

### MiniDSP version

Version 1.0 and up only supports `minidsp-rs` 1.10 and up. This version allows sources to be selected through the UI.

Versions lower than 1.0 support `minidsp-rs` 1.9.  Only volume control is supported for the MiniDSP.

### How the server works

Server is a simple Rust server.  It makes call directly to the underlying binaries required for MiniDSP.  See https://minidsp-rs.pages.dev/cli/.

### Rust prep
In `minidsp-server`:

`cargo sqlx migrate add users --source db/migrations`
`cargo sqlx migrate add settings --source db/migrations`

This creates the scripts in db/migrations.  Edit these as neeeded.  Then run

`cargo sqlx database create --database-url sqlite:$(pwd)/minidsp.sqlite`

`DATABASE_URL="sqlite:$(pwd)/minidsp.sqlite" cargo sqlx migrate run --source db/migrations`

`DATABASE_URL="sqlite:$(pwd)/minidsp.sqlite" cargo sqlx prepare`





## Installing/running

Download the packaged static UI and server code `minidsp-ui.tar.gz` from `releases`.  Extract the tar.gz.  It is recommended to run the server as a service.  See [examples/install_script.sh](./examples/install_script.sh) for an example of how to install server.  See [examples/minidsp-ui.service](./examples/minidsp-ui.service) for an example of how to run the server as a service.

There is a "power/on" and "power/off" endpoint as well as the ability to query the RPBI pin that controls this.  This is to power an external amp using a 12v trigger (in reality, 5v from the RPBI USB port).  To enable this, set the environment variable "USE_RELAY" to anything, and set the "RELAY_PIN" to the value of the GPIO pin controlling the relay.  To get a mapping of the GPIO pins, run `cat /sys/kernel/debug/gpio`.

## Bluetooth with VOL20

A Bluetooth interface for the [Fosi VOL20](https://fosiaudio.com/products/vol20-bluetooth-volume-control-knob) is also available.  It relies on [node-ble](https://github.com/chrvadala/node-ble) and [node-hid](https://github.com/node-hid/node-hid), so any limitations that exist in those libraries also exist for the Bluetooth Interface.

From a terminal, run `bluetoothctl`.  Type `list` to view controllers.  Pick your preferred controller by typing `select [controlleraddress]`.  Then, with the Fosi volume control on, run `scan on`.  This will find nearby bluetooth devices.  The VOL20 should be found.  Once it is, type `scan off`.  Then type `devices` to confirm that the VOL20 is still showing up.  Type `connect [deviceaddress]` and it will connect and "pair" with the VOL20 device.  Exit the CLI tool by typing `exit` or `quit`.

Next, run the [bluetoothserver](./server/bt.js) as root.  It should show a list of bluetooth controller IDs.  This is different from the controller address.  By default, the server will select the first controller ID.  It will then print the address.  If you want a different controller, pass in the environment variable `BLUETOOTH_DEVICE_ID`.  For example, `sudo BLUETOOTH_DEVICE_ID=hci1 node server/bt.js`.

## Use with Dante

### Pipewire
Set up a Dante/AES67 sink with Pipewire.  I'm fairly certain this requires a hardware network clock.  The Raspberry pi 5 has a hardware clock.  Install on Ubuntu Server 25.10.

This page has instructions on how to set up ptp: https://gitlab.freedesktop.org/pipewire/pipewire/-/wikis/AES67#setting-up-ptp-time-sync.
linuxptp is required for network clock sync
* `sudo apt install pipewire wireplumber pipewire-alsa linuxptp`

On the consumer ONLY update the `/etc/linuxptp/ptp4l.conf` by setting `clientOnly 1`.  Then `sudo systemctl daemon-reload` and `sudo systemctl enable --now ptp4l@eth0.service`.  On the producer, keep `clientOnly 0`.

On the producer, update the service to force hardware:

`sudo systemctl edit ptp4l@eth0.service`

And add

```lang=toml
[Service]
ExecStart=
ExecStart=/usr/sbin/ptp4l -i %I -f /etc/linuxptp/ptp4l.conf -2 -m
```

Add a udev rule from here: https://gitlab.freedesktop.org/pipewire/pipewire/-/blob/78642cc53bd84c2ad529f2175cc50a658d1e52c0/src/daemon/90-pipewire-aes67-ptp.rules.  Create a file `sudo nano /etc/udev/rules.d/90-pipewire-aes67-ptp.rules` and add the content.  A restart is likely needed, or a hard retrigger (`sudo udevadm trigger`).  Pipewire runs as a user and thus doesn't have access to ptp unless the udev rule is added.

You will also need to start/restart the services associated with pipewire:
`systemctl --user restart pipewire`, `systemctl --user restart wireplumber`

* Copy the pipewire config file from `/usr/share/pipewire/pipewire-aes67.conf` and put in a local directory (~/.config/pipewire) for testing.  Update the file as needed (eg channel count).  Example configs for both the producer and receiver are in the [examples](./examples/pipewire).  Then copy over to the permanent configs, eg: `sudo cp ~/.config/pipewire/pipewire-aes67-receiver.conf /etc/pipewire/pipewire.conf.d/`, then restart services `systemctl --user daemon-reexec`, `systemctl --user restart pipewire`.  `journalctl --no-hostname --user -u pipewire -f` for logs.

For testing:

`pipewire -c pipewire-aes67.conf`

This should start up.  Now run `pw-cli list-objects Node` and it should show a sink running as well as a minidsp HTx Alsa device (if you have connected to the MiniDSP via USB).

Now each of the 8 channels between the aes67 source and alsa sink need to be linked.  This can be done manually or can be automated via the [link_aes67_to_minidsp](./examples/link_aes67_to_minidsp.sh) shell script.

#### Manually

For each of the 8 channels, run (changing the channel on each run) `pw-link 'aes67-source:receive_1' 'alsa_output.usb-miniDSP_miniDSP_Flex_HTx-00.analog-surround-71:monitor_FL'`

#### Automatically

`./examples/link_aes67_to_minidsp.sh aes67-source alsa_output.usb-miniDSP_miniDSP_Flex_HTx-00.analog-surround-71`

Check links via `pw-link -l`.

Test communication by running this on the producer: `speaker-test -c 8 -t wav --format S24_BE -D pipewire`

`pw-play /usr/share/sounds/alsa/Front_Left.wav --target=rtp-sink-osmc`

### Diagnostics
Run diagnostics: `pw-top`

`sudo systemctl status ptp4l@eth0.service`

On producer, to check for traffic over 5004:
`sudo tcpdump -n -i eth0 udp port 5004`

### Inferno

I have forked [Inferno](https://github.com/danielhstahl/inferno) and [Statime](https://github.com/danielhstahl/statime) in order to generate arm binaries.

`curl -L https://github.com/danielhstahl/statime/releases/download/v0.0.4/statime-aarch64-unknown-linux-gnu.tar.gz -o statime.tar.gz`

`curl -L https://github.com/danielhstahl/inferno/releases/download/v0.0.6/inferno2pipe-aarch64-unknown-linux-gnu.tar.gz -o inferno2pipe.tar.gz`

`tar -xzvf statime.tar.gz`

`tar -xzvf inferno2pipe.tar.gz`

In another terminal,
`sudo ./statime -c inferno-ptpv1.toml`

`./inferno2pipe -c 8 -o plughw:1,0`
