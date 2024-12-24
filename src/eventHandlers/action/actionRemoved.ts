import vAtisManager from "@managers/vatis";
import svgManager from "@managers/svg";

export const handleActionRemoved = (count: number) => {
  if (count === 0) {
    vAtisManager.disconnect();
    svgManager.reset();
  }
};
