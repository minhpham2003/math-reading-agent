import { useEffect, useRef, type FocusEvent, type KeyboardEvent, type FormEvent } from 'react';

type Props = {
  value: string;
  placeholder: string;
  label: string;
  className?: string;
  required?: boolean;
  maxLength?: number;
  onSave: (value: string) => boolean;
};

/** A single editable text node: no input replacement, border, or layout shift. */
export function InlineProjectField({ value, placeholder, label, className = '', required = false, maxLength = 300, onSave }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const cancelled = useRef(false);

  // Keep the DOM text aligned with externally saved project metadata.
  // Never replace the text while the user is typing (that would move the caret).
  useEffect(() => {
    if (ref.current && document.activeElement !== ref.current && ref.current.textContent !== value) {
      ref.current.textContent = value;
    }
  }, [value]);

  function save(event: FocusEvent<HTMLSpanElement>) {
    const element = event.currentTarget;
    if (cancelled.current) {
      cancelled.current = false;
      element.textContent = value;
      return;
    }
    const next = (element.textContent ?? '').trim();
    if ((required && !next) || !onSave(next)) {
      element.textContent = value;
    } else {
      element.textContent = next;
    }
  }

  function keyDown(event: KeyboardEvent<HTMLSpanElement>) {
    if (event.key === 'Enter') {
      event.preventDefault();
      event.currentTarget.blur();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      cancelled.current = true;
      event.currentTarget.textContent = value;
      event.currentTarget.blur();
    }
  }

  function input(event: FormEvent<HTMLSpanElement>) {
    const element = event.currentTarget;
    if ((element.textContent ?? '').length > maxLength) {
      element.textContent = (element.textContent ?? '').slice(0, maxLength);
      const range = document.createRange();
      range.selectNodeContents(element);
      range.collapse(false);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }

  return <span
    ref={ref}
    className={'project-inline-text ' + className}
    contentEditable
    suppressContentEditableWarning
    role="textbox"
    aria-label={'Edit ' + label}
    aria-multiline="false"
    data-placeholder={placeholder}
    spellCheck={false}
    tabIndex={0}
    onKeyDown={keyDown}
    onInput={input}
    onBlur={save}
  >{value}</span>;
}
