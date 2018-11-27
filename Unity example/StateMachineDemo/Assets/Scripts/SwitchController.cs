using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class SwitchController : MonoBehaviour
{
    private bool locked = false;

    public void Poke(bool left)
    {
        Lock();
        iTween.RotateTo(gameObject, iTween.Hash("z", left ? 45 : -45, "time", 1, "oncomplete", "Unlock", "easetype", iTween.EaseType.easeInOutQuad));
    }

    public void Lock()
    {
        locked = true;
    }

    public void Unlock()
    {
        locked = false;
    }

    public bool IsLocked()
    {
        return locked;
    }
}
