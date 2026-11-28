import React from 'react';
import {render,screen,fireEvent} from '@testing-library/react';
import {describe,it,expect,vi} from 'vitest';
import {LoadFailure} from './LoadFailure';
vi.mock('../hooks/useTranslation',()=>({useTranslation:()=>({language:'fr'})}));
describe('LoadFailure',()=>{it('shows an error and calls retry',()=>{const retry=vi.fn();render(<LoadFailure onRetry={retry}/>);expect(screen.getByRole('alert')).toHaveTextContent('Impossible de charger les données');fireEvent.click(screen.getByRole('button',{name:'Réessayer'}));expect(retry).toHaveBeenCalledTimes(1)})});
