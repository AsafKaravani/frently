import { Button } from '@mui/material';
import { styled } from '@mui/material/styles';

const PREFIX = 'HomePage';
const classes = {
    root: `${PREFIX}-root`,
};

const Root = styled('div')(({ theme }) => ({
    [`&.${classes.root}`]: {},
}));

export function HomePage() {
    return (
        <Root className={classes.root}>
            <Button variant="contained">asd</Button>
        </Root>
    );
}
