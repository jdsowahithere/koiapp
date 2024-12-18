import React, { useState, useMemo, useRef, useEffect } from 'react';
import './Cell.css';
import { ReactComponent as EditICON } from '../../icons/edit_FILL0_wght200_GRAD0_opsz24.svg';
import { ReactComponent as ChevronICON } from'../../icons/chevron_right_FILL0_wght200_GRAD0_opsz24.svg';
import { ReactComponent as DeleteICON } from'../../icons/delete_FILL0_wght200_GRAD0_opsz24.svg';
import { ReactComponent as AddCircleICON } from'../../icons/add_circle_FILL0_wght200_GRAD0_opsz24.svg';


const Cell = ({
    dataKey,
    currentState,
    state,
    value,
    formula,
    placeholder,
    children,
    contentEditable,
    ignoreClicks,
    cellWidth,
    cellHeight,
    cursorBox,
    cursorCoords,
    selectionBox,
    selectionBoxCoords,
}) => {

    // track hover state
    const [isHovered, setIsHovered] = useState(false);

    const editableDivRef = useRef(null);

    const renderGrid = () => {
        if (!state) return null;
        const baseStateStyle = state['base'];
        const currentStateStyle = state[currentState];
        if (currentStateStyle.gridVisible) {
            return (
                <div className='grid' style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundSize: `${baseStateStyle.gridSize}px ${baseStateStyle.gridSize}px`,
                    backgroundImage: `
                    linear-gradient(to bottom, ${baseStateStyle.gridColor} 1px, transparent 1px),
                    linear-gradient(to right, ${baseStateStyle.gridColor} 1px, transparent 1px)`,
                    backgroundPosition: '0 0',
                    zIndex: -1, // behind everything (otherwise may obscure borders, etc)
                }}></div>
            )
        }
    };


    const handleMouseOver = (e) => {
        const isEntering = e.type === 'mouseenter';
        setIsHovered(isEntering);
    }


    // primary styling of Cell component
    const cellContainerStyle = useMemo(() => {
        const base = state ? state['base'] : {};
        const current = state ? state[currentState] : {};
        const hover = state ? state['hover'] : {};
        const hoverState = isHovered && hover;

        const widthValue = hoverState && hover.width ? hover.width : current.width ? current.width : base.width ? base.width : cellWidth;
        const parsedWidthValue = isNaN(parseInt(widthValue)) ? widthValue : `${parseInt(widthValue)}px`;

        const heightValue = hoverState && hover.height ? hover.height : current.height ? current.height : base.height ? base.height : cellHeight;
        const parsedHeightValue = isNaN(parseInt(heightValue)) ? heightValue : `${parseInt(heightValue)}px`;

        const cellStateLeft = current.left ? current.left : base.left ? base.left : 0;
        const parsedCellStateLeft = isNaN(parseInt(cellStateLeft)) ? cellStateLeft : `${parseInt(cellStateLeft)}px`;
        const baseleftPercentage = base.horizAlign === 'center' ? '50%' : base.horizAlign === 'end' ? '100%' : '0%';
        const leftValue = base.horizAlign === 'end' 
            ? `calc(${baseleftPercentage} + ${parsedCellStateLeft} - ${parsedWidthValue})`
            : base.horizAlign === 'center'
            ? `calc(${baseleftPercentage} + ${parsedCellStateLeft} - ${parsedWidthValue} / 2)`
            : `calc(${baseleftPercentage} + ${parsedCellStateLeft})`;
        

        const cellStateTop = current.top ? current.top : base.top ? base.top : 0;
        const parsedCellStateTop = isNaN(parseInt(cellStateTop)) ? cellStateTop : `${parseInt(cellStateTop)}px`;
        const baseTopPercentage = base.vertAlign === 'center' ? '50%' : base.vertAlign === 'end' ? '100%' : '0%';
        const topValue = base.vertAlign === 'end'
            ? `calc(${baseTopPercentage} + ${parsedCellStateTop} - ${parsedHeightValue})`
            : base.vertAlign === 'center'
            ? `calc(${baseTopPercentage} + ${parsedCellStateTop} - ${parsedHeightValue} / 2)`
            : `calc(${baseTopPercentage} + ${parsedCellStateTop})`;


        // const transformXValue = base.horizAlign === 'center' ? '-50%' : base.horizAlign === 'end' ? '-100%' : 'none';
        // const transformYValue = base.vertAlign === 'center' ? '-50%' : base.vertAlign === 'end' ? '-100%' : 'none';

        return {
            display: 'flex',
            overflow: base.overflow || 'visible',
            overflowX: base.overflowX || 'visible',
            overflowY: base.overflowY || 'visible',
            scrollbarHeight: base.scrollbarHeight || 0,
            boxSizing: 'border-box',
            zIndex: 1,
            flexDirection: 'row',
            //transition: 'height 0.2s', // this causes lag when resizing cells
            // justifyContent: current.justifyContent || base.justifyContent || 'flex-start',
            // alignItems: current.alignItems || base.alignItems || 'flex-start',
            position: current.position || base.position || 'relative',
            width: widthValue,
            height: heightValue,
            // minHeight: hoverState && hover.minHeight ? hover.minHeight : current.minHeight || base.minHeight,
            // maxHeight: hoverState && hover.maxHeight ? hover.maxHeight : current.maxHeight || base.maxHeight,
            // minWidth: hoverState && hover.minWidth ? hover.minWidth : current.minWidth || base.minWidth,
            // maxWidth: hoverState && hover.maxWidth ? hover.maxWidth : current.maxWidth || base.maxWidth,
            left: leftValue,
            // right: hoverState && hover.right ? hover.right : current.right || base.right,
            top: topValue,
            //transform: `translate(${transformXValue}, ${transformYValue})`,
            bottom: hoverState && hover.bottom ? hover.bottom : current.bottom || base.bottom,
            backgroundColor: hoverState && hover.backgroundColor ? hover.backgroundColor : current.backgroundColor || base.backgroundColor,
            color: hoverState && hover.color ? hover.color : current.color || base.color,
            border: hoverState && hover.border ? hover.border : current.border || base.border,
            borderRadius: hoverState && hover.borderRadius ? hover.borderRadius : current.borderRadius || base.borderRadius,
            scrollTop: base.scrollTop || 0,
        }
    }, [isHovered, currentState, state]);

    
    const cellContent = useMemo(() => {
        let currentStateContent = null;

        if (state) {
            if (state[currentState] && state[currentState].content) {
                currentStateContent = state[currentState].content;
            }
            else if (currentState === 'editing' && formula) {
                currentStateContent = formula;
            }
            else if (!value) {
                currentStateContent = placeholder;
            }
            else {
                currentStateContent = value;
            }
        }

        return currentStateContent;
    }, [currentState, state, value, formula]);

    // styling of Cell content
    const cellContentStyle = useMemo(() => {
    });

    // styling of Cell children
    const cellChildrenStyle = useMemo(() => {
    });
    
    // JSX Return
    return (
        <div
            className='cell-container'
            data-cellid={ignoreClicks ? null : dataKey}
            onMouseEnter={handleMouseOver}
            onMouseLeave={handleMouseOver} 
            style={cellContainerStyle}
        >
            {renderGrid()}
            {cellContent && <div 
                className='cell-content'
                ref={contentEditable ? editableDivRef : null}
                contentEditable={currentState === 'editing' ? contentEditable : false}
                dangerouslySetInnerHTML={{ __html: cellContent }}
                style={{
                    position: 'relative',
                    zIndex: 1,
                    whiteSpace: 'nowrap',
                    outline: 'none',
                    textOverflow: 'elipsis',
                    overflow: 'hidden',
                }}
            >
            </div>}
            {children && React.Children.toArray(children).some(child => child !== null) ? <div 
                className='cell-children' 
                style={{
                    position: 'relative',
                    backgroundColor: 'transparent',
                    padding: '0px',
                    margin: '0px',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    zIndex: 2,
                    boxSizing: 'border-box',
                }}
            >
                {children}
            </div> : null}
            {selectionBox ? <div style={{
                position: 'absolute',
                width: `${selectionBoxCoords.width}px`,
                height: `${selectionBoxCoords.height}px`,
                left: `${selectionBoxCoords.left}px`,
                top: `${selectionBoxCoords.top}px`,
                transition: `height 0.05s, width 0.05s, left 0.05s, top 0.05s`,
                border: '2px solid blue',
                boxSizing: 'border-box',
                zIndex: 5,
                pointerEvents: 'none',
            }}></div> : null}
            {cursorBox ? <div style={{
                position: 'absolute',
                width: `${cursorCoords.width}px`,
                height: `${cursorCoords.height}px`,
                left: `${cursorCoords.left}px`,
                top: `${cursorCoords.top}px`,
                backgroundColor: 'rgba(0, 0, 255, 0.1)',
                zIndex: 6,
                pointerEvents: 'none',
            }}></div> : null}
        </div>
    );

};

export default Cell;