import { styled } from '@mui/material/styles';
import { useOnInit } from '../../utils/hooks';
import { StyleSheetMap } from '../../utils/types/index';
import { useSetRecoilState } from 'recoil';
import { atom_pageName } from '../../core/navigation/page-name.state';

export function EditBusinessPage() {
    const s_setPageName = useSetRecoilState(atom_pageName);

    useOnInit(() => {
        s_setPageName('עמוד עסק');
    });

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
