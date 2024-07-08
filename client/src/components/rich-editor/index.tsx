import { InputLabel, useMantineColorScheme } from "@mantine/core";
import React, { useCallback, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css";
import styled from "styled-components";

const PlaceholderText = styled.div<{ colorSchema?: string }>`
  .ql-editor.ql-blank::before {
    color: var(--mantine-color-dark-2);
    left: 15px;
    pointer-events: none;
    position: absolute;
    right: 15px;
    font-size: 16px;
    font-style: normal;
    opacity: 0.5;
  }
  .ql-container {
    background-color: ${props =>
        props.colorSchema === 'light'
            ? 'rgb(249, 250, 251)'
            : 'var(--mantine-color-dark-6)'}!important;
  }
  .ql-toolbar {
    border: 2px solid
      ${props =>
        props.colorSchema === 'light'
            ? 'var(--mantine-color-gray-4)'
            : 'var(--mantine-color-dark-4)'}!important;
    border-width: 2px;
    border-radius: 1rem 1rem 0rem 0rem;
  }
  .ql-container.ql-snow {
    border: 2px solid
      ${props =>
        props.colorSchema === 'light'
            ? 'var(--mantine-color-gray-4)'
            : 'var(--mantine-color-dark-4)'}!important;
    border-width: 2px;
    border-radius: 0rem 0rem 1rem 1rem;
  }
  .ql-editor {
    font-size: 16px;
    color: var(--mantine-color-text);
  }
`;

interface Props
{
    label?: string;
    placeholder?: string;
    value?: string;
    onChange?: (value: string) => void;
}

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

const RichTextEditor = (props: Props) =>
{
    const { value, onChange, label, placeholder } = props;
    const { colorScheme } = useMantineColorScheme();

    const quillRef = useRef(null);

    const handleRef = useCallback((ref: any) =>
    {
        if (ref !== null)
        {
            const quill = ref.getEditor();

            if (quill)
            {
                // disable spellcheck
                quill.root.setAttribute("spellcheck", false);
                quillRef.current = quill;
            }
        }
    }, []);

    // Configuração do editor Quill
    const modules = {
        toolbar: [
            [{ header: "1" }, { header: "2" }],
            [{ size: [] }],
            ["bold", "italic", "underline", "strike", "blockquote"],
            [{ list: "ordered" }, { list: "bullet" }, { indent: "-1" }, { indent: "+1" }],
            ["link", "image", "video"],

        ],
    };

    const handleChange = (html: any) =>
    {
        if (onChange)
        {
            onChange(html);
        }
    };


    return (
        <PlaceholderText colorSchema={colorScheme}>
            <InputLabel required>{label}</InputLabel>

            <ReactQuill
                defaultValue={placeholder}
                // @ts-ignore
                ref={handleRef}
                placeholder={placeholder}
                theme="snow"
                value={value}
                onChange={handleChange}
                modules={modules}
            />

        </PlaceholderText>
    );
};

export default RichTextEditor;