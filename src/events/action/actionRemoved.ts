import svgManager from "@managers/svg";

export const handleActionRemoved = (count: number) => {
  if (count === 0) {
    svgManager.reset();
  }
};
