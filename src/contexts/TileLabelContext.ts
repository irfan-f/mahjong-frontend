import { createContext, useContext } from 'react';

export const TileLabelContext = createContext(false);
export const useTileLabel = () => useContext(TileLabelContext);
