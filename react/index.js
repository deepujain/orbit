/* playskin for React: one hook that keeps the page's skin, saved choice and effects in step, and re-renders when the
   skin changes. Works in client components; on the server it renders with no skin. */
import { useEffect, useRef, useState } from "react";
import { createPlayskin } from "../src/index.js";

/** Returns [theme, setTheme]. Options are those of createPlayskin; they are read once, when the hook first runs. */
export function usePlayskin(options) {
  const ref = useRef(null);
  const [theme, setTheme] = useState(null);
  useEffect(() => {
    const skin = createPlayskin(options);
    ref.current = skin;
    setTheme(skin.get());
    const stop = skin.subscribe(setTheme);
    return () => {
      stop();
      skin.destroy();
      ref.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return [theme, (next) => ref.current?.set(next)];
}

/** Drop-in component for the root of an app: applies the saved skin and renders nothing. */
export function PlayskinRoot(props) {
  usePlayskin(props);
  return null;
}
