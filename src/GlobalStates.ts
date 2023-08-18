export enum movementState {
    move,
    rot,
    nothing
}

export let isMove: movementState = movementState.nothing;

export function setIsMove(value: movementState){
    isMove = value;
}