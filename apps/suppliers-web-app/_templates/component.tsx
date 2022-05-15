import { styled } from '@mui/material/styles';
import { StyleSheetMap } from '../src/utils/types/index';

export function Comp() {
    return <Root className={classes.root}></Root>;
}

const PREFIX = 'Comp';
const classes = {
    root: `${PREFIX}-root`,
};

const Root = styled('div')(
    ({ theme }) =>
        ({
            [`&.${classes.root}`]: {},
        } as StyleSheetMap)
);
