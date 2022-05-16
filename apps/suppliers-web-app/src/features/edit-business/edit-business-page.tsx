import { styled } from '@mui/material/styles';
import { useSetRecoilState } from 'recoil';
import { StyleSheetMap } from '@utils/types';
import { atom_pageName } from '@core/navigation/page-name.state';
import { useTypedLazyQuery } from '@generated/zeus/apollo';
import { useOnInit } from '@utils/hooks';
import { useTypedMutation } from '@generated/zeus/apollo';

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
