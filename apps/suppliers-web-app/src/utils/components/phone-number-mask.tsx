import React from 'react';
import { IMaskInput } from 'react-imask';
import { InputType } from '../../../generated/zeus/index';

interface CustomProps {
    onChange: (event: { target: { name: string; value: string } }) => void;
    name: string;
}

export const PhoneNumberMask = React.forwardRef<HTMLElement, CustomProps>(
    function TextMaskCustom(props, ref) {
        const { onChange, ...other } = props;
        return (
            <IMaskInput
                {...other}
                mask="(#00) 000-0000"
                definitions={{
                    '#': /[0-9]/,
                }}
                inputRef={ref as any}
                onAccept={(value: any) =>
                    onChange({ target: { name: props.name, value } })
                }
                overwrite
                inputMode="numeric"
            />
        );
    }
);
