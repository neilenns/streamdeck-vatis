import mainLogger from "@utils/logger";

const logger = mainLogger.child({ service: "handleActionAdded" });

export const handleActionAdded = () => {
  logger.info("Action added");
};
