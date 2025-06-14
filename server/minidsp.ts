import { execFile } from "child_process";
interface HtxWrite {
  source: string;
  volume: number;
  preset: number;
}
export function minidspStatus(): Promise<HtxWrite> {
  return new Promise((res, rej) =>
    execFile(`minidsp`, ["-o", "json"], (err, stdout, stderr) => {
      if (err) {
        rej(err);
      } else {
        res(JSON.parse(stdout).master);
      }
    })
  );
}
export function setMinidspVol(gain: number) {
  return new Promise<void>((res, rej) =>
    execFile(
      `minidsp`,
      ["gain", "--", gain.toString()],
      (err, stdout, stderr) => {
        if (err) {
          rej(err);
        } else {
          res();
        }
      }
    )
  );
}
export function incrementMinidspVol(gain: number) {
  return new Promise<void>((res, rej) =>
    execFile(
      `minidsp`,
      ["gain", "--relative", "--", gain.toString()],
      (err, stdout, stderr) => {
        if (err) {
          rej(err);
        } else {
          res();
        }
      }
    )
  );
}
export function setMinidspPreset(preset: number) {
  //0 indexed
  return new Promise<void>((res, rej) =>
    execFile(
      `minidsp`,
      ["config", preset.toString()],
      (err, stdout, stderr) => {
        if (err) {
          rej(err);
        } else {
          res();
        }
      }
    )
  );
}
export function setMinidspInput(source: string) {
  // note that the source output from minidspStatus has first letter capitalized,
  // but setting the source requires lowercase
  // see https://minidsp-rs.pages.dev/cli/master/source
  return new Promise<void>((res, rej) =>
    execFile(
      `minidsp`,
      ["source", source.toLowerCase()],
      (err, stdout, stderr) => {
        if (err) {
          rej(err);
        } else {
          res();
        }
      }
    )
  );
}
