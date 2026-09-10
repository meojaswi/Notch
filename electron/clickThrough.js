export function initializeClickThrough(window) {
  let isInteractive = true;

  function setInteractive(nextInteractive) {
    isInteractive = Boolean(nextInteractive);
    window.setIgnoreMouseEvents(!isInteractive, { forward: true });
  }

  function handleMouseEnter() {
    setInteractive(true);
  }

  function handleMouseLeave() {
    setInteractive(false);
  }

  setInteractive(false);

  window.on("closed", () => {
    window.removeListener("enter-html-full-screen", handleMouseEnter);
    window.removeListener("leave-html-full-screen", handleMouseLeave);
  });

  window.on("enter-html-full-screen", handleMouseEnter);
  window.on("leave-html-full-screen", handleMouseLeave);

  return {
    setInteractive,
    get interactive() {
      return isInteractive;
    },
  };
}
