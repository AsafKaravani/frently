import { useEffect } from 'react';
export function useOnInit(effect: () => void) {
    useEffect(effect, []);
}
