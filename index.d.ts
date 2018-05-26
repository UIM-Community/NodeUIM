/**
 * ProbeUtility Definition
 */
declare class ProbeUtility {
    constructor(login: string, password: string);

    // Properties
    static void: string;

    // Methods
    exec(nimPath: string | string[], callback: string | string[], args?: (string|number)[]): Promise<any>;
}

declare namespace ProbeUtility {

    // Probes callbacks interface
    export interface callbacks {
        hub: hub_callbacks;
    }

    // Hub probe callbacks
    interface hub_callbacks {
        getrobots: {
            name: number;
            detail: nubmer;
        }
    }

}

export as namespace ProbeUtility;
export = ProbeUtility;