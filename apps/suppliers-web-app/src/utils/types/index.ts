import { Interpolation, MUIStyledCommonProps, Theme } from '@mui/system';

export type StyleSheetMap = Record<
    string,
    Interpolation<
        MUIStyledCommonProps<Theme> &
            React.ClassAttributes<HTMLDivElement> &
            React.HTMLAttributes<HTMLDivElement>
    >
>;
