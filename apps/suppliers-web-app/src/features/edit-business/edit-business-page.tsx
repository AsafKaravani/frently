import { styled } from '@mui/material/styles';
import { StyleSheetMap } from '../../utils/types/index';

export function EditBusinessPage() {
    return <Root className={classes.root}>EditBusinessPage</Root>;
}

const PREFIX = 'EditBusinessPage';
const classes = {
    root: `${PREFIX}-root`,
};

const Root = styled('div')(
    ({ theme }) =>
        ({
            [`&.${classes.root}`]: {},
        } as StyleSheetMap)
);
