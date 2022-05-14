import { styled } from '@mui/styles';

export function Comp() {
    return <Root className={classes.root}></Root>;
}

const PREFIX = 'Comp';
const classes = {
    root: `${PREFIX}-root`,
};

const Root = styled('div')(({ theme }) => ({
    [`&.${classes.root}`]: {},
}));
